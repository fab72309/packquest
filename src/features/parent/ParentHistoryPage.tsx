import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft, CircleAlert, Clock3, History, PackageCheck, RefreshCw } from 'lucide-react'
import { Link } from 'react-router'
import { supabase } from '../../lib/supabase/client'
import { parentAction } from '../../services/parentApi'
import './ParentHistoryPage.css'

type MissionRow = { id: string; child_profile_id: string; title: string; period: string | null; status: string; sent_at: string | null; completed_at: string | null; cancelled_at: string | null; created_at: string }
type ItemRow = { id: string; mission_id: string; category_name: string; label: string; quantity: number | null; status: string; help_request: string | null; help_response: string | null }
type ChildRow = { id: string; name: string }

export function ParentHistoryPage() {
  const [missions, setMissions] = useState<MissionRow[]>([])
  const [items, setItems] = useState<ItemRow[]>([])
  const [children, setChildren] = useState<ChildRow[]>([])
  const [loading, setLoading] = useState(Boolean(supabase))
  const [error, setError] = useState(supabase ? '' : 'La connexion au compte n’est pas configurée.')
  const [view, setView] = useState<'active' | 'history'>('active')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [limit, setLimit] = useState(50)

  const load = useCallback(async () => {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    setError('')
    if (!session) { setError('Connectez-vous à votre compte parent pour voir les missions.'); setLoading(false); return }
    const [missionResult, childResult] = await Promise.all([
      supabase.from('missions').select('id,child_profile_id,title,period,status,sent_at,completed_at,cancelled_at,created_at')
        .in('status', view === 'history' ? ['completed', 'cancelled'] : ['draft', 'sent', 'started'])
        .order('created_at', { ascending: false }).limit(limit),
      supabase.from('child_profiles').select('id,name'),
    ])
    if (missionResult.error || childResult.error) { setError('Les missions ne peuvent pas être chargées. Réessayez.'); setLoading(false); return }
    const loadedMissions = missionResult.data as MissionRow[]
    setMissions(loadedMissions)
    setChildren(childResult.data as ChildRow[])
    if (loadedMissions.length) {
      const result = await supabase.from('mission_items').select('id,mission_id,category_name,label,quantity,status,help_request,help_response').in('mission_id', loadedMissions.map((mission) => mission.id)).order('position')
      if (result.error) setError('Les détails des missions ne peuvent pas être chargés. Réessayez.')
      else setItems(result.data as ItemRow[])
    } else setItems([])
    setLoading(false)
  }, [limit, view])

  useEffect(() => { void load() }, [load])

  const visible = missions.filter((mission) => view === 'history' ? ['completed', 'cancelled'].includes(mission.status) : !['completed', 'cancelled'].includes(mission.status))

  function chooseView(next: 'active' | 'history') {
    if (next === view) return
    setLoading(true)
    setLimit(50)
    setView(next)
  }

  async function changeMission(action: 'send_mission' | 'cancel_mission', missionId: string) {
    if (action === 'cancel_mission' && !window.confirm('Annuler cette mission ? Elle restera visible dans l’historique.')) return
    setBusy(true); setError(''); setNotice('')
    try { await parentAction(action, { mission_id: missionId }); await load(); setNotice(action === 'send_mission' ? 'Mission envoyée.' : 'Mission annulée.') }
    catch { setError('Cette mission n’a pas pu être modifiée. Actualisez et réessayez.') }
    finally { setBusy(false) }
  }

  async function sendReply(missionId: string, itemId: string) {
    const response = replies[itemId]?.trim()
    if (!response) return
    setBusy(true); setError(''); setNotice('')
    try { await parentAction('reply_help', { mission_id: missionId, item_id: itemId, response }); setReplies((current) => ({ ...current, [itemId]: '' })); await load(); setNotice('Réponse envoyée à votre enfant.') }
    catch { setError('La réponse n’a pas pu être envoyée. Réessayez.') }
    finally { setBusy(false) }
  }

  return <div className="page history-page">
    <Link className="back-link" to="/parent/account"><ArrowLeft size={16} aria-hidden="true" /> Mon compte</Link>
    <div className="page-heading"><div><p className="eyebrow">MISSIONS DE LA FAMILLE</p><h1>Suivi et historique</h1><p className="page-subtitle">Les listes terminées gardent les affaires demandées et leur état au moment de la préparation.</p></div></div>
    <div className="history-toolbar"><div className="history-tabs" role="tablist" aria-label="État des missions"><button type="button" role="tab" aria-selected={view === 'active'} onClick={() => chooseView('active')}>En cours</button><button type="button" role="tab" aria-selected={view === 'history'} onClick={() => chooseView('history')}>Historique</button></div><button className="history-refresh" type="button" disabled={busy || loading} onClick={() => { setLoading(true); void load() }}><RefreshCw size={16} aria-hidden="true" /> Actualiser</button></div>
    {notice && <p className="account-message" role="status">{notice}</p>}
    {loading ? <div className="history-empty" role="status">Chargement des missions…</div> : error ? <div className="history-empty" role="alert"><CircleAlert size={23} aria-hidden="true" /><p>{error}</p><button className="button button--secondary" type="button" onClick={() => void load()}>Réessayer</button></div> : visible.length === 0 ? <div className="history-empty"><History size={26} aria-hidden="true" /><h2>{view === 'history' ? 'Aucune mission terminée' : 'Aucune mission en cours'}</h2><p>{view === 'history' ? 'Les préparations terminées apparaîtront ici.' : 'Créez une mission pour que votre enfant commence sa préparation.'}</p><Link className="button button--primary" to="/parent/create">Préparer une mission</Link></div> : <div className="history-list">{visible.map((mission) => {
      const missionItems = items.filter((item) => item.mission_id === mission.id)
      const packed = missionItems.filter((item) => item.status === 'packed').length
      const issues = missionItems.filter((item) => item.status === 'missing' || item.status === 'not_found').length
      const child = children.find((entry) => entry.id === mission.child_profile_id)
      const date = mission.completed_at || mission.cancelled_at || mission.sent_at || mission.created_at
      return <article className="history-card" key={mission.id}><div className="history-card__top"><span className={`history-status history-status--${mission.status}`}>{mission.status === 'completed' ? 'Terminée' : mission.status === 'cancelled' ? 'Annulée' : mission.status === 'started' ? 'En préparation' : mission.status === 'sent' ? 'Envoyée' : 'Brouillon'}</span><span><Clock3 size={14} aria-hidden="true" /> {new Date(date).toLocaleDateString('fr-FR')}</span></div><h2>{mission.title}</h2><p>{child?.name ?? 'Enfant'}{mission.period ? ` · ${mission.period}` : ''}</p><div className="history-card__stats"><span><PackageCheck size={16} aria-hidden="true" /> {packed}/{missionItems.length} rangées</span><span><CircleAlert size={16} aria-hidden="true" /> {issues} à regarder</span></div>{mission.status === 'draft' && <button className="button button--primary" type="button" disabled={busy} onClick={() => void changeMission('send_mission', mission.id)}>Envoyer à {child?.name ?? 'mon enfant'}</button>}{['draft', 'sent', 'started'].includes(mission.status) && <button className="history-cancel" type="button" disabled={busy} onClick={() => void changeMission('cancel_mission', mission.id)}>Annuler la mission</button>}<details><summary>Voir les affaires</summary><ul>{missionItems.map((item) => <li key={item.id}><div><span>{item.label}{item.quantity && item.quantity > 1 ? ` × ${item.quantity}` : ''}</span><small>{item.category_name}</small>{item.help_request && <p className="history-help">Demande : {item.help_request}</p>}{item.help_response && <p className="history-help">Votre réponse : {item.help_response}</p>}{item.help_request && !item.help_response && mission.status === 'started' && <form className="history-reply" onSubmit={(event) => { event.preventDefault(); void sendReply(mission.id, item.id) }}><label className="sr-only" htmlFor={`reply-${item.id}`}>Répondre pour {item.label}</label><input id={`reply-${item.id}`} value={replies[item.id] ?? ''} onChange={(event) => setReplies((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={240} placeholder="Un indice pour votre enfant…" /><button type="submit" disabled={busy || !replies[item.id]?.trim()}>Répondre</button></form>}</div><strong>{item.status === 'packed' ? 'Dans le sac' : item.status === 'missing' ? 'Manquante' : item.status === 'not_found' ? 'Introuvable' : 'Non indiquée'}</strong></li>)}</ul></details></article>
    })}</div>}
    {missions.length >= limit && <button className="button button--secondary history-more" type="button" disabled={loading} onClick={() => { setLoading(true); setLimit((current) => current + 50) }}>Afficher plus de missions</button>}
  </div>
}
