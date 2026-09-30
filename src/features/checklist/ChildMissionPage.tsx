import { ArrowLeft, ArrowRight, Check, CircleHelp, PackageCheck, Sparkles } from 'lucide-react'
import { useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ChecklistItemCard } from './ChecklistItemCard'
import { QuestRewards } from './QuestRewards'
import { useDemoMission } from '../../state/DemoMissionContext'

function HelpComposer({ itemId, label, request, onSend }: {
  itemId: string
  label: string
  request?: { message: string; response?: string }
  onSend: (itemId: string, message: string) => void
}) {
  const [message, setMessage] = useState(request?.message ?? '')

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!message.trim()) return
    onSend(itemId, message.trim())
  }

  if (request?.response) {
    return (
      <div className="child-help-response">
        <span className="child-help-response__icon"><CircleHelp size={16} aria-hidden="true" /></span>
        <p><strong>Ton parent te répond :</strong> {request.response}</p>
      </div>
    )
  }

  if (request) {
    return <p className="help-sent"><Check size={15} aria-hidden="true" /> Demande envoyée : « {request.message} »</p>
  }

  return (
    <form className="child-help-form" onSubmit={submit}>
      <label htmlFor={`help-${itemId}`}><CircleHelp size={16} aria-hidden="true" /> Besoin d’un indice ?</label>
      <div className="child-help-form__row">
        <input id={`help-${itemId}`} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={`Demander pour ${label.toLowerCase()}…`} maxLength={160} />
        <button type="submit" disabled={!message.trim()}>Demander <ArrowRight size={15} aria-hidden="true" /></button>
      </div>
    </form>
  )
}

export function ChildMissionPage() {
  const { mission, rewardProgress, helpRequests, updateItemStatus, finishPreparation, sendHelpRequest } = useDemoMission()
  const categories = useMemo(() => [...new Set(mission.items.map((item) => item.category))], [mission.items])
  const [selectedCategory, setActiveCategory] = useState(categories[0] ?? '')
  const activeCategory = categories.includes(selectedCategory) ? selectedCategory : (categories[0] ?? '')
  const activeItems = mission.items.filter((item) => item.category === activeCategory)
  const handled = mission.items.filter((item) => item.status !== 'pending').length
  const packed = mission.items.filter((item) => item.status === 'packed').length
  const issues = mission.items.filter((item) => item.status === 'not_found' || item.status === 'missing').length
  const total = mission.items.length
  const progress = total ? Math.round((handled / total) * 100) : 0
  const isRecorded = mission.stage === 'preparation-recorded'
  const requests = new Map(helpRequests.map((request) => [request.itemId, request]))

  function handleFinish() {
    finishPreparation()
  }

  return (
    <div className="child-page child-checklist-page">
      <div className="child-page-topline">
        <Link className="child-back" to="/demo/child"><ArrowLeft size={17} aria-hidden="true" /><span>Accueil</span></Link>
        <span className="child-mission-status"><span className="child-mission-status__dot" /> {isRecorded ? 'Préparation renseignée' : mission.stage === 'sent' ? 'Mission reçue' : 'En cours'}</span>
      </div>

      <header className="child-checklist-heading">
        <p className="child-checklist-heading__date">{mission.period}</p>
        <h1>{mission.title}</h1>
        <p>Une zone à la fois. Range l’affaire ou indique ce qui bloque.</p>
      </header>

      <section className="child-progress-card" aria-label="Progression de la préparation">
        <div className="progress-orbit" style={{ '--progress': `${progress}%` } as CSSProperties}>
          <div className="progress-orbit__center"><strong>{progress}%</strong><span>indiqué</span></div>
        </div>
        <div className="child-progress-card__copy"><span className="child-progress-card__label"><Sparkles size={14} aria-hidden="true" /> TA PROGRESSION</span><strong>{handled} <small>/ {total} affaires indiquées</small></strong><div className="child-progress-legend"><span><i className="legend-dot legend-dot--packed" />{packed} dans la valise</span><span><i className="legend-dot legend-dot--issue" />{issues} à regarder</span></div></div>
      </section>

      {isRecorded && (
        <section className="child-finish-banner" role="status">
          <span className="child-finish-banner__icon"><PackageCheck size={22} aria-hidden="true" /></span>
          <div><strong>Ta préparation est renseignée !</strong><p>{issues ? `${issues} affaire${issues > 1 ? 's restent' : ' reste'} à regarder avec ton parent.` : 'Tu as indiqué chaque affaire de la liste.'}</p></div>
          <span className="child-finish-banner__demo">APERÇU</span>
        </section>
      )}

      <div className="category-heading"><div><p className="eyebrow">TON PARCOURS</p><h2>Choisis une zone</h2></div><span>{categories.length} zones</span></div>
      <nav className="category-tabs" aria-label="Catégories de la checklist">
        {categories.map((category) => {
          const categoryItems = mission.items.filter((item) => item.category === category)
          const done = categoryItems.filter((item) => item.status !== 'pending').length
          const selected = activeCategory === category
          return (
            <button key={category} type="button" aria-pressed={selected} className={`category-tab${selected ? ' is-active' : ''}`} onClick={() => setActiveCategory(category)}>
              <span>{category}</span><small>{done}/{categoryItems.length}</small>
            </button>
          )
        })}
      </nav>

      <section className="checklist-items" aria-label={activeCategory}>
        {activeItems.map((item) => (
          <div className="checklist-item-wrap" key={item.id}>
            <ChecklistItemCard
              label={item.label}
              quantity={item.quantity}
              status={item.status}
              onStatusChange={(nextStatus) => updateItemStatus(item.id, nextStatus)}
            />
            {item.status === 'not_found' && (
              <HelpComposer itemId={item.id} label={item.label} request={requests.get(item.id)} onSend={sendHelpRequest} />
            )}
            {requests.get(item.id)?.response && item.status !== 'not_found' && (
              <div className="child-help-response"><span className="child-help-response__icon"><CircleHelp size={16} aria-hidden="true" /></span><p><strong>Ton parent te répond :</strong> {requests.get(item.id)?.response}</p></div>
            )}
          </div>
        ))}
      </section>

      <section className={`child-finish-card${isRecorded ? ' child-finish-card--recorded' : ''}`}>
        <div className="child-finish-card__copy"><span className="child-finish-card__icon"><Check size={18} aria-hidden="true" /></span><div><strong>{isRecorded ? 'Tu peux encore ajuster la liste.' : 'Tu as fini pour le moment ?'}</strong><p>{isRecorded ? 'Changer un état mettra à jour ton aperçu.' : handled === total ? 'Tous les objets ont un état.' : `Encore ${total - handled} affaire${total - handled > 1 ? 's' : ''} à indiquer.`}</p></div></div>
        {isRecorded ? (
          <span className="button button--child-done"><Check size={16} aria-hidden="true" /> Renseignée</span>
        ) : (
          <button className="button button--child-finish" type="button" disabled={total === 0 || handled < total} onClick={handleFinish}>Terminer ma préparation <ArrowRight size={16} aria-hidden="true" /></button>
        )}
      </section>

      <QuestRewards handled={rewardProgress} total={total} compact />

      <p className="child-footnote">Aucune pénalité si tu demandes de l’aide. Le but est de ne rien oublier ensemble.</p>
    </div>
  )
}
