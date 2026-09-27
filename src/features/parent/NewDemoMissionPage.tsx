import { ArrowLeft, ArrowRight, Check, ClipboardList, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { loadLocalDemoMissionTemplates } from '../../services/demoTemplateStorage'
import { demoTemplates } from '../../data/demoTemplates'
import { useDemoMission } from '../../state/DemoMissionContext'

export function NewDemoMissionPage() {
  const navigate = useNavigate()
  const { createDemoMission } = useDemoMission()
  const [{ templates, firstTemplateId }] = useState(() => {
    const templates = import.meta.env.DEV ? loadLocalDemoMissionTemplates() : demoTemplates
    return { templates, firstTemplateId: templates[0]?.id ?? '' }
  })
  const [selectedId, setSelectedId] = useState(firstTemplateId)
  const [title, setTitle] = useState('La valise de la semaine')
  const [period, setPeriod] = useState(templates[0]?.period ?? '')
  const selectedTemplate = templates.find((template) => template.id === selectedId) ?? templates[0]

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedTemplate || selectedTemplate.items.length === 0 || !title.trim() || !period.trim()) return
    createDemoMission(selectedTemplate, title, period)
    navigate('/parent/mission')
  }

  return (
    <div className="page parent-page page--narrow">
      <Link className="back-link" to="/parent"><ArrowLeft size={16} aria-hidden="true" /> Retour au tableau de bord</Link>
      <div className="page-heading page-heading--compact">
        <p className="eyebrow"><span className="eyebrow-dot" /> NOUVELLE MISSION · DÉMO</p>
        <h1>On prépare la suite<span className="heading-period">.</span></h1>
        <p className="page-subtitle">Choisissez un modèle, puis envoyez la mission à l’aperçu enfant.</p>
      </div>

      <form className="mission-form" onSubmit={handleSubmit}>
        <fieldset className="template-choice">
          <legend><span className="form-step">01</span> Choisir un modèle</legend>
          <div className="template-grid">
            {templates.map((template) => {
              const selected = template.id === selectedId
              return (
                <button
                  className={`template-card${selected ? ' is-selected' : ''}`}
                  type="button"
                  key={template.id}
                  aria-pressed={selected}
                  disabled={template.items.length === 0}
                  onClick={() => { setSelectedId(template.id); setPeriod(template.period) }}
                >
                  <span className="template-card__icon"><ClipboardList size={20} aria-hidden="true" /></span>
                  <span className="template-card__copy"><strong>{template.name}</strong><small>{template.description}</small></span>
                  <span className="template-card__check">{selected && <Check size={14} aria-hidden="true" />}</span>
                  <span className="template-card__meta">{template.items.length === 0 ? 'Ajoutez une affaire à ce modèle pour l’utiliser' : <>{template.items.length} affaires <span>·</span> {new Set(template.items.map((item) => item.category)).size} catégories</>}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="form-section">
          <label htmlFor="mission-title"><span className="form-step">02</span> Donner un nom à la mission</label>
          <input
            id="mission-title"
            className="text-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={60}
            required
          />
          <label htmlFor="mission-period">Quand préparer le sac ?</label>
          <input
            id="mission-period"
            className="text-input"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            maxLength={60}
            placeholder="Ex. Semaine prochaine"
            required
          />
        </div>

        <div className="prototype-note">
          <Sparkles size={17} aria-hidden="true" />
          <p><strong>Mode de test :</strong> {import.meta.env.DEV ? 'la mission reprend une copie du modèle enregistré sur cet appareil' : 'la mission utilise un modèle d’exemple, distinct de ceux de votre compte'}. Elle reste en mémoire jusqu’au rechargement.</p>
        </div>

        <div className="form-actions">
          <Link className="button button--quiet" to="/parent">Annuler</Link>
          <button className="button button--primary" type="submit" disabled={!selectedTemplate || selectedTemplate.items.length === 0 || !title.trim() || !period.trim()}>Créer la mission de test <ArrowRight size={17} aria-hidden="true" /></button>
        </div>
      </form>
    </div>
  )
}
