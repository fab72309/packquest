import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, CircleAlert, Send } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import type { TemplateDefinition } from '../../domain/template'
import { supabase } from '../../lib/supabase/client'
import { loadTemplateLibrary } from '../../services/templateLibraryService'
import { parentAction } from '../../services/parentApi'
import { TemplateItemPicker } from './TemplateItemPicker'
import './ConnectedNewMissionPage.css'

type Child = { id: string; name: string }
type CreatedMission = { id: string; title: string }

export function ConnectedNewMissionPage() {
  const navigate = useNavigate()
  const [children, setChildren] = useState<Child[]>([])
  const [templates, setTemplates] = useState<TemplateDefinition[]>([])
  const [childId, setChildId] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
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
      const nextTemplate = loadedTemplates[0]
      setTemplates(loadedTemplates)
      setChildren(loadedChildren)
      setChildId((current) => loadedChildren.some((entry) => entry.id === current) ? current : (loadedChildren[0]?.id ?? ''))
      setTemplateId(nextTemplate?.id ?? '')
      setSelectedItemIds(nextTemplate?.items.map((item) => item.id) ?? [])
      setTitle((current) => current.trim() ? current : (nextTemplate?.name ?? ''))
      setPeriod((current) => current.trim() ? current : (nextTemplate?.period ?? ''))
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
    const selectedTemplate = templates.find((entry) => entry.id === templateId)
    if (!childId || !selectedTemplate || !title.trim() || selectedItemIds.length === 0 || busy) return
    setBusy(true); setError('')
    let draftId = draft?.id
    try {
      if (draft) { await sendMission(draft.id); return }
      const selectedIds = new Set(selectedItemIds)
      const result = await parentAction<{ mission: CreatedMission }>('create_mission', {
        child_id: childId,
        template_id: selectedTemplate.id,
        item_ids: selectedTemplate.items.filter((item) => selectedIds.has(item.id)).map((item) => item.id),
        title: title.trim(),
        period: period.trim() || undefined,
      })
      draftId = result.mission.id
      setDraft(result.mission)
      await sendMission(result.mission.id)
    } catch { setError(draftId ? 'La mission est enregistrée en brouillon, mais elle n’a pas pu être envoyée. Réessayez.' : 'La mission n’a pas pu être créée. Vérifiez les champs et réessayez.') }
    finally { setBusy(false) }
  }

  const selectedTemplate = templates.find((entry) => entry.id === templateId)

  function chooseTemplate(nextTemplateId: string) {
    const nextTemplate = templates.find((entry) => entry.id === nextTemplateId)
    setTemplateId(nextTemplateId)
    setSelectedItemIds(nextTemplate?.items.map((item) => item.id) ?? [])
    setTitle((current) => !current.trim() || current === selectedTemplate?.name ? (nextTemplate?.name ?? '') : current)
    setPeriod((current) => !current.trim() || current === selectedTemplate?.period ? (nextTemplate?.period ?? '') : current)
  }

  function toggleItem(itemId: string, selected: boolean) {
    setSelectedItemIds((current) => selected
      ? current.includes(itemId) ? current : [...current, itemId]
      : current.filter((id) => id !== itemId))
  }

  return (
    <div className="page connected-new-page">
      <Link className="back-link" to="/parent/history"><ArrowLeft size={16} aria-hidden="true" /> Missions</Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">NOUVELLE MISSION</p>
          <h1>Composer la valise</h1>
          <p className="page-subtitle">Nommez la mission, puis choisissez les affaires que votre enfant devra emporter.</p>
        </div>
      </div>

      {loading ? (
        <div className="connected-new-card" role="status">Chargement des profils et modèles…</div>
      ) : error && children.length === 0 && templates.length === 0 ? (
        <div className="connected-new-card" role="alert">
          <CircleAlert size={22} aria-hidden="true" />
          <p>{error}</p>
          <button className="button button--secondary" type="button" onClick={() => { setLoading(true); void load() }}>Réessayer</button>
        </div>
      ) : children.length === 0 ? (
        <div className="connected-new-card">
          <h2>Ajoutez d’abord un enfant</h2>
          <p>Son profil permet de lui envoyer la mission sans adresse e-mail.</p>
          <Link className="button button--primary" to="/parent/pairing">Créer un profil <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      ) : templates.length === 0 ? (
        <div className="connected-new-card">
          <h2>Préparez d’abord un modèle</h2>
          <p>Créez une liste réutilisable d’affaires à emporter, puis composez la mission de votre enfant.</p>
          <Link className="button button--primary" to="/parent/templates">Gérer les modèles <ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      ) : (
        <form className="connected-new-card connected-new-form" onSubmit={(event) => void submit(event)}>
          <label>Nom de la mission
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} placeholder="Ex. Valise du week-end" required disabled={Boolean(draft) || busy} />
          </label>
          <label>Pour quel enfant ?
            <select value={childId} onChange={(event) => setChildId(event.target.value)} disabled={Boolean(draft) || busy}>
              {children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
            </select>
          </label>
          <label>Partir de quel modèle ?
            <select value={templateId} onChange={(event) => chooseTemplate(event.target.value)} disabled={Boolean(draft) || busy}>
              {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select>
          </label>

          {selectedTemplate && (
            <TemplateItemPicker
              items={selectedTemplate.items}
              selectedItemIds={selectedItemIds}
              onToggleItem={toggleItem}
              onSetAll={(selected) => setSelectedItemIds(selected ? selectedTemplate.items.map((item) => item.id) : [])}
              disabled={Boolean(draft) || busy}
            />
          )}

          <label>Pour quand ?
            <input value={period} onChange={(event) => setPeriod(event.target.value)} maxLength={80} placeholder={selectedTemplate?.period ?? 'Ex. Semaine prochaine'} disabled={Boolean(draft) || busy} />
          </label>
          {error && <p className="account-message account-message--error" role="alert">{error}</p>}
          <button className="button button--primary" type="submit" disabled={busy || !selectedTemplate?.items.length || selectedItemIds.length === 0 || !title.trim()}>
            <Send size={17} aria-hidden="true" /> {busy ? 'Envoi en cours…' : draft ? 'Réessayer l’envoi' : 'Envoyer la mission'}
          </button>
        </form>
      )}
    </div>
  )
}
