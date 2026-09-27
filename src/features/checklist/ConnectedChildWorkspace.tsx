import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, Clock3, House, PackageCheck, RefreshCw, WifiOff } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ChecklistItemCard } from './ChecklistItemCard'
import {
  ChildOfflineError,
  enqueueChildAction,
  forgetChildDevice,
  getCachedChildSnapshot,
  getChildSyncState,
  hasPairedChildDevice,
  resolveChildConflictWithServer,
  syncChild,
  type ChildActionInput,
  type ChildSnapshot,
} from '../../services/childOffline'
import './ConnectedChildWorkspace.css'

export function ConnectedChildWorkspace({ missionPage = false }: { missionPage?: boolean }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [snapshot, setSnapshot] = useState<ChildSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(0)
  const [offline, setOffline] = useState(!navigator.onLine)
  const [conflict, setConflict] = useState(false)
  const [error, setError] = useState('')
  const [helpText, setHelpText] = useState<Record<string, string>>({})
  const activeMissions = useMemo(() => snapshot?.missions.filter((entry) => entry.status === 'sent' || entry.status === 'started') ?? [], [snapshot])
  const mission = (missionPage && searchParams.get('mission')
    ? activeMissions.find((entry) => entry.id === searchParams.get('mission'))
    : undefined) ?? activeMissions.find((entry) => entry.status === 'started') ?? activeMissions[0] ?? null

  const settle = useCallback(async () => {
    try {
      const result = await syncChild()
      if (result.snapshot) setSnapshot(result.snapshot)
      setPending(result.pending); setConflict(result.conflict); setOffline(!result.online)
    } catch (syncError) {
      if (syncError instanceof ChildOfflineError && (syncError.kind === 'not_paired' || syncError.status === 401 || syncError.status === 403)) { navigate('/child/join', { replace: true }); return }
      setOffline(!navigator.onLine)
      setError('La mise à jour attend une connexion. Tes changements restent sur cet appareil.')
    }
  }, [navigate])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        if (!await hasPairedChildDevice()) { navigate('/child/join', { replace: true }); return }
        const cached = await getCachedChildSnapshot()
        const state = await getChildSyncState()
        if (!active) return
        setSnapshot(cached); setPending(state.pending); setConflict(state.conflict); setLoading(false)
        if (navigator.onLine) await settle()
        else if (!cached) setError('Ouvre une mission une première fois avec Internet pour la retrouver ensuite hors ligne.')
      } catch {
        if (active) { setLoading(false); setError('Tes missions ne peuvent pas être ouvertes sur cet appareil.') }
      }
    }
    void load()
    return () => { active = false }
  }, [navigate, settle])

  useEffect(() => {
    const onOnline = () => { setOffline(false); void settle() }
    const onOffline = () => setOffline(true)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline) }
  }, [settle])

  async function act(action: ChildActionInput): Promise<boolean> {
    setError('')
    try {
      const next = await enqueueChildAction(action)
      setSnapshot(next)
      const state = await getChildSyncState()
      setPending(state.pending)
      if (navigator.onLine) {
        await settle()
        const remaining = await getChildSyncState()
        if (remaining.pending > 0 && !remaining.conflict) await settle()
      }
      return true
    } catch (actionError) {
      setError(actionError instanceof ChildOfflineError ? actionError.message : 'Cette action n’a pas pu être enregistrée sur cet appareil.')
      return false
    }
  }

  async function resolveConflict() {
    if (!window.confirm('Tes changements en attente seront retirés de cet appareil. Demande de l’aide à ton parent si tu n’es pas sûr. Continuer ?')) return
    setError('')
    try {
      const refreshed = await resolveChildConflictWithServer()
      setSnapshot(refreshed); setConflict(false); setPending(0)
    } catch { setError('La liste à jour ne peut pas être chargée. Tes changements restent en attente sur cet appareil.') }
  }

  async function leaveFamily() {
    if (!window.confirm('Retirer cette famille de cet appareil ? Les changements non envoyés seront perdus et tu devras scanner un nouveau QR code.')) return
    try { await forgetChildDevice(); navigate('/child/join', { replace: true }) }
    catch { setError('Cet appareil n’a pas pu être délié. Réessaie avec ton parent.') }
  }

  function requestHelp(event: FormEvent<HTMLFormElement>, itemId: string) {
    event.preventDefault()
    const message = helpText[itemId]?.trim()
    if (!message) return
    void act({ type: 'request_help', itemId, message }).then((saved) => {
      if (saved) setHelpText((current) => ({ ...current, [itemId]: '' }))
    })
  }

  const total = mission?.items.length ?? 0
  const handled = mission?.items.filter((item) => item.status !== 'pending').length ?? 0
  const issues = mission?.items.filter((item) => item.status === 'missing' || item.status === 'not_found').length ?? 0
  const categories = mission ? [...new Set(mission.items.map((item) => item.category_name))] : []

  return <div className="connected-child-shell">
    <a className="skip-link" href="#main-content">Aller au contenu</a>
    <header className="connected-child-topbar"><Link to="/child" className="connected-child-brand">✦ PackQuest</Link><span>{snapshot?.child.name ?? 'Mon espace'}</span></header>
    <main id="main-content" className="connected-child-main">
      {offline && <div className="connected-child-sync connected-child-sync--offline" role="status"><WifiOff size={17} aria-hidden="true" /> Sans Internet. Tu peux continuer ta liste.</div>}
      {pending > 0 && <div className="connected-child-sync" role="status"><Clock3 size={17} aria-hidden="true" /> {pending} changement{pending > 1 ? 's' : ''} à envoyer quand Internet revient.</div>}
      {conflict && <div className="connected-child-alert" role="alert"><CircleAlert size={19} aria-hidden="true" /><p>Cette liste a changé sur un autre appareil. Les changements affichés ici ne sont pas encore enregistrés. Demande à ton parent de t’aider à vérifier.</p><button type="button" onClick={() => void resolveConflict()}>Recharger la liste</button></div>}
      {error && <div className="connected-child-alert" role="alert"><CircleAlert size={19} aria-hidden="true" /><p>{error}</p></div>}
      {loading ? <div className="connected-child-empty" role="status">Chargement de tes missions…</div> : !snapshot ? <div className="connected-child-empty"><p>Aucune mission enregistrée sur cet appareil.</p><button className="button button--secondary" type="button" onClick={() => void settle()}><RefreshCw size={17} aria-hidden="true" /> Réessayer</button></div> : !mission ? <div className="connected-child-empty"><PackageCheck size={36} aria-hidden="true" /><h1>Tout est prêt pour la prochaine mission !</h1><p>Ton parent t’enverra une nouvelle liste quand il aura préparé ta valise.</p><button className="button button--secondary" type="button" onClick={() => void settle()}><RefreshCw size={17} aria-hidden="true" /> Actualiser</button></div> : missionPage ? <>
        <div className="connected-child-mission-toolbar"><Link className="connected-child-back" to="/child"><ArrowLeft size={17} aria-hidden="true" /> Accueil</Link><button type="button" onClick={() => void settle()} disabled={offline}><RefreshCw size={16} aria-hidden="true" /> Actualiser</button></div>
        <p className="connected-child-eyebrow">{mission.period ?? 'MA MISSION'}</p><h1>{mission.title}</h1><p className="connected-child-intro">Range chaque affaire ou indique ce qui bloque. Tu peux continuer même sans Internet.</p>
        <div className="connected-child-progress"><strong>{handled} / {total}</strong><span>affaires indiquées · {issues} à regarder ensemble</span><div role="progressbar" aria-label="Affaires indiquées" aria-valuenow={handled} aria-valuemin={0} aria-valuemax={total}><span style={{ width: `${total ? handled / total * 100 : 0}%` }} /></div></div>
        {categories.map((category) => <section className="connected-child-category" key={category}><h2>{category}</h2>{mission.items.filter((item) => item.category_name === category).map((item) => <div key={item.id} className="connected-child-item"><ChecklistItemCard label={item.label} quantity={item.quantity} status={item.status} disabled={mission.status !== 'started' || conflict} onStatusChange={(status) => void act({ type: 'update_item', itemId: item.id, status })} />{item.help_response && <p className="connected-child-help-reply"><strong>Ton parent :</strong> {item.help_response}</p>}{item.status === 'not_found' && !item.help_request && mission.status === 'started' && <form className="connected-child-help" onSubmit={(event) => requestHelp(event, item.id)}><label htmlFor={`help-${item.id}`}>Besoin d’un indice ?</label><div><input id={`help-${item.id}`} value={helpText[item.id] ?? ''} onChange={(event) => setHelpText((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={160} placeholder="Demande à ton parent…" /><button type="submit" disabled={!helpText[item.id]?.trim()}>Demander</button></div></form>}{item.help_request && !item.help_response && <p className="connected-child-help-reply">Demande envoyée à ton parent.</p>}</div>)}</section>)}
        {mission.status === 'sent' ? <button className="button connected-child-primary" type="button" onClick={() => void act({ type: 'start_mission', missionId: mission.id })}>Commencer <ArrowRight size={18} aria-hidden="true" /></button> : <button className="button connected-child-primary" type="button" disabled={total === 0 || handled < total || conflict} onClick={() => void act({ type: 'complete_mission', missionId: mission.id })}>J’ai terminé ma préparation <ArrowRight size={18} aria-hidden="true" /></button>}
      </> : <><p className="connected-child-eyebrow">BONJOUR {snapshot.child.name.toUpperCase()}</p><h1>{activeMissions.length > 1 ? 'Tes missions' : 'Prêt pour ta mission ?'}</h1><div className="connected-child-mission-list">{activeMissions.map((entry) => { const done = entry.items.filter((item) => item.status !== 'pending').length; const count = entry.items.length; return <section className="connected-child-mission-card" key={entry.id}><span>{entry.status === 'started' ? 'EN COURS' : 'NOUVELLE MISSION'}</span><h2>{entry.title}</h2><p>{entry.period}</p><div className="connected-child-progress"><strong>{done} / {count}</strong><span>affaires indiquées</span><div role="progressbar" aria-label={`Affaires indiquées pour ${entry.title}`} aria-valuenow={done} aria-valuemin={0} aria-valuemax={count}><span style={{ width: `${count ? done / count * 100 : 0}%` }} /></div></div><Link className="button connected-child-primary" to={`/child/mission?mission=${encodeURIComponent(entry.id)}`}>{entry.status === 'sent' ? 'Voir ma mission' : 'Continuer ma mission'} <ArrowRight size={18} aria-hidden="true" /></Link></section> })}</div><p className="connected-child-note">Aucun chrono. Avance à ton rythme et demande de l’aide si tu en as besoin.</p></>}
      {snapshot && !missionPage && !loading && <button className="connected-child-leave" type="button" onClick={() => void leaveFamily()}>Retirer cette famille de cet appareil</button>}
    </main>
    <nav className="connected-child-nav" aria-label="Navigation enfant"><Link to="/child"><House size={19} aria-hidden="true" /> Accueil</Link><Link to="/child/mission"><PackageCheck size={19} aria-hidden="true" /> Ma mission</Link></nav>
  </div>
}
