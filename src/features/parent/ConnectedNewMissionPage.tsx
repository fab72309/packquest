import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, Send } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import type { TemplateDefinition } from '../../domain/template'
import { supabase } from '../../lib/supabase/client'
import { loadTemplateLibrary } from '../../services/templateLibraryService'
import { parentAction } from '../../services/parentApi'
import './ConnectedNewMissionPage.css'

type Child = { id: string; name: string }
type CreatedMission = { id: string; title: string }

export function ConnectedNewMissionPage() {
  const navigate = useNavigate()
  const [children, setChildren] = useState<Child[]>([])
  const [templates, setTemplates] = useState<TemplateDefinition[]>([])
  const [childId, setChildId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [title, setTitle] = useState('')
  const [period, setPeriod] = useState('')
  const [draft, setDraft] = useState<CreatedMission | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(supabase ? '' : 'La connexion au compte n’est pas configurée.')

  const load = useCallback(async () => {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    setError('')
    if (!session) { setError('Connectez-vous à votre compte parent.'); setLoading(false); return }
    try {
      const [loadedTemplates, childResult] = await Promise.all([
        loadTemplateLibrary(supabase, session.user.id),
        supabase.from('child_profiles').select('id,name').order('created_at'),
      ])
      if (childResult.error) throw childResult.error
      const loadedChildren = childResult.data as Child[]
      setTemplates(loadedTemplates)
      setChildren(loadedChildren)
      setChildId((current) => loadedChildren.some((entry) => entry.id === current) ? current : (loadedChildren[0]?.id ?? ''))
      setTemplateId((current) => loadedTemplates.some((entry) => entry.id === current) ? current : (loadedTemplates[0]?.id ?? ''))
    } catch { setError('Les profils ou modèles ne peuvent pas être chargés. Réessayez.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])

  async function sendMission(missionId: string) {
    await parentAction('send_mission', { mission_id: missionId })
    navigate('/parent/history', { replace: true })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!childId || !templateId || busy) return
    setBusy(true); setError('')
    let draftId = draft?.id
    try {
      if (draft) { await sendMission(draft.id); return }
      const result = await parentAction<{ mission: CreatedMission }>('create_mission', {
        child_id: childId, template_id: templateId,
        title: title.trim() || undefined, period: period.trim() || undefined,
      })
      draftId = result.mission.id
      setDraft(result.mission)
      await sendMission(result.mission.id)
    } catch { setError(draftId ? 'La mission est enregistrée en brouillon, mais elle n’a pas pu être envoyée. Réessayez.' : 'La mission n’a pas pu être créée. Vérifiez les champs et réessayez.') }
    finally { setBusy(false) }
  }

  const selectedTemplate = templates.find((entry) => entry.id === templateId)
  return <div className="page connected-new-page"><Link className="back-link" to="/parent/history"><ArrowLeft size={16} aria-hidden="true" /> Missions</Link><div className="page-heading"><div><p className="eyebrow">NOUVELLE MISSION</p><h1>Préparer sa liste</h1><p className="page-subtitle">Choisissez l’enfant et un modèle. La mission gardera sa propre copie de la liste après l’envoi.</p></div></div>
    {loading ? <div className="connected-new-card" role="status">Chargement des profils et modèles…</div> : error && children.length === 0 && templates.length === 0 ? <div className="connected-new-card" role="alert"><CircleAlert size={22} aria-hidden="true" /><p>{error}</p><button className="button button--secondary" type="button" onClick={() => { setLoading(true); void load() }}>Réessayer</button></div> : children.length === 0 ? <div className="connected-new-card"><h2>Ajoutez d’abord un enfant</h2><p>Son profil permet de lui envoyer la mission sans adresse e-mail.</p><Link className="button button--primary" to="/parent/pairing">Créer un profil <ArrowRight size={17} aria-hidden="true" /></Link></div> : templates.length === 0 ? <div className="connected-new-card"><h2>Préparez d’abord un modèle</h2><p>Un modèle contient les affaires à emporter. Vous pourrez ensuite l’envoyer à votre enfant.</p><Link className="button button--primary" to="/parent/templates">Gérer les modèles <ArrowRight size={17} aria-hidden="true" /></Link></div> : <form className="connected-new-card connected-new-form" onSubmit={(event) => void submit(event)}><label>Pour quel enfant ?<select value={childId} onChange={(event) => setChildId(event.target.value)} disabled={Boolean(draft)}>{children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</select></label><label>Quelle liste ?<select value={templateId} onChange={(event) => { setTemplateId(event.target.value); setTitle(''); setPeriod('') }} disabled={Boolean(draft)}>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label><p className="connected-new-preview">{selectedTemplate?.items.length ?? 0} affaires dans ce modèle</p><label>Nom de la mission<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder={selectedTemplate?.name ?? ''} disabled={Boolean(draft)} /></label><label>Pour quand ?<input value={period} onChange={(event) => setPeriod(event.target.value)} maxLength={80} placeholder={selectedTemplate?.period ?? ''} disabled={Boolean(draft)} /></label>{error && <p className="account-message account-message--error" role="alert">{error}</p>}<button className="button button--primary" type="submit" disabled={busy || !selectedTemplate?.items.length}><Send size={17} aria-hidden="true" /> {busy ? 'Envoi en cours…' : draft ? 'Réessayer l’envoi' : 'Envoyer la mission'}</button></form>}
  </div>
}
