import { ArrowRight, CircleAlert, CircleCheck, MessageCircle, PackageCheck, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useDemoMission } from '../../state/DemoMissionContext'

function HelpReply({ itemId, itemLabel, request, onReply }: {
  itemId: string
  itemLabel: string
  request?: { message: string; response?: string }
  onReply: (itemId: string, response: string) => void
}) {
  const [response, setResponse] = useState(request?.response ?? '')

  function submitReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!response.trim()) return
    onReply(itemId, response.trim())
  }

  if (!request) return <p className="issue-detail__hint">Noa n’a pas encore demandé d’aide sur cette affaire.</p>

  return (
    <div className="help-thread">
      <div className="help-message help-message--child"><span className="help-message__label">Noa</span><p>{request.message}</p></div>
      {request.response ? (
        <div className="help-message help-message--parent"><span className="help-message__label">Votre réponse</span><p>{request.response}</p></div>
      ) : (
        <form className="reply-form" onSubmit={submitReply}>
          <label className="sr-only" htmlFor={`reply-${itemId}`}>Répondre à Noa au sujet de {itemLabel}</label>
          <input id={`reply-${itemId}`} value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Un petit indice pour l’aider…" maxLength={160} />
          <button type="submit" disabled={!response.trim()} aria-label={`Envoyer une réponse au sujet de ${itemLabel}`}><ArrowRight size={17} aria-hidden="true" /></button>
        </form>
      )}
    </div>
  )
}

export function ParentMissionPage() {
  const { mission, helpRequests, replyToHelpRequest } = useDemoMission()
  const total = mission.items.length
  const treated = mission.items.filter((item) => item.status !== 'pending').length
  const packed = mission.items.filter((item) => item.status === 'packed').length
  const progress = total ? Math.round((treated / total) * 100) : 0
  const issues = mission.items.filter((item) => item.status === 'not_found' || item.status === 'missing')
  const requests = new Map(helpRequests.map((request) => [request.itemId, request]))

  return (
    <div className="page parent-page">
      <Link className="back-link" to="/parent"><ArrowRight className="back-link__arrow" size={16} aria-hidden="true" /> Tableau de bord</Link>
      <div className="page-heading page-heading--spread page-heading--mission">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> QUÊTE DE NOA · APERÇU LOCAL</p>
          <h1>{mission.title}<span className="heading-period">.</span></h1>
          <p className="page-subtitle">Noa <span className="meta-divider" /> {mission.period} <span className="meta-divider" /> Modèle : {mission.templateName}</p>
        </div>
        <Link className="button button--secondary" to="/demo/child">Passer à l’aperçu enfant <ArrowRight size={17} aria-hidden="true" /></Link>
      </div>

      <section className="mission-summary-card">
        <div className="mission-summary-card__top">
          <div><span className="summary-label">Affaires indiquées</span><strong>{progress}%</strong></div>
          <div className="summary-counts"><span><i className="legend-dot legend-dot--packed" />{packed} dans la valise</span><span><i className="legend-dot legend-dot--issue" />{issues.length} à regarder</span></div>
        </div>
        <div className="progress-track" role="progressbar" aria-label="Affaires traitées par Noa" aria-valuenow={treated} aria-valuemin={0} aria-valuemax={total}><span style={{ width: `${progress}%` }} /></div>
        <p className="summary-foot">{treated} / {total} affaires renseignées <span>·</span> {mission.stage === 'sent' ? 'En attente du démarrage' : mission.stage === 'preparation-recorded' ? 'Préparation renseignée en mode démo' : 'Noa a commencé sa préparation'}</p>
      </section>

      <div className="mission-columns">
        <section className="content-panel" aria-labelledby="issues-title">
          <div className="panel-heading"><div><p className="eyebrow">VOTRE ATTENTION</p><h2 id="issues-title">À regarder ensemble</h2></div><span className="panel-count">{issues.length}</span></div>
          {issues.length ? (
            <div className="issue-detail-list">
              {issues.map((item) => (
                <article className="issue-detail" id={`issue-${item.id}`} key={item.id}>
                  <div className="issue-detail__header">
                    <span className={`issue-marker issue-marker--${item.status}`} aria-hidden="true">{item.status === 'not_found' ? <CircleAlert size={17} /> : <PackageCheck size={17} />}</span>
                    <div><strong>{item.label}</strong><small>{item.category}{item.quantity ? ` · × ${item.quantity}` : ''}</small></div>
                    <span className={`status-pill status-pill--${item.status}`}>{item.status === 'not_found' ? 'Introuvable' : 'Manquant'}</span>
                  </div>
                  {item.status === 'not_found' && (
                    <HelpReply itemId={item.id} itemLabel={item.label} request={requests.get(item.id)} onReply={replyToHelpRequest} />
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state empty-state--roomy"><CircleCheck size={24} aria-hidden="true" /><strong>Tout est calme pour le moment.</strong><p>Les affaires signalées apparaîtront ici.</p></div>
          )}
        </section>

        <aside className="side-panel">
          <div className="side-panel__icon"><MessageCircle size={19} aria-hidden="true" /></div>
          <p className="eyebrow">UN PETIT COUP DE POUCE</p>
          <h2>Une réponse suffit souvent.</h2>
          <p>Les demandes restent attachées à l’affaire concernée. Pas besoin d’ouvrir une conversation séparée.</p>
          <div className="side-panel__example"><span className="side-panel__bubble">« Regarde dans le tiroir du bureau. »</span><Sparkles size={15} aria-hidden="true" /></div>
        </aside>
      </div>

      <section className="all-items-section">
        <div className="section-heading"><div><p className="eyebrow">CHECKLIST</p><h2>Tout le contenu de la mission</h2></div><div className="section-heading__actions"><Link className="text-link" to="/demo/templates">Gérer mes modèles <ArrowRight size={16} aria-hidden="true" /></Link><Link className="text-link" to="/demo/child/mission">Ouvrir la checklist <ArrowRight size={16} aria-hidden="true" /></Link></div></div>
        <div className="parent-items-list">
          {mission.items.map((item) => (
            <div className="parent-item-row" key={item.id}>
              <span className={`parent-item-check parent-item-check--${item.status}`} aria-hidden="true">{item.status === 'packed' ? <CircleCheck size={17} /> : item.status === 'pending' ? null : <CircleAlert size={16} />}</span>
              <span><strong>{item.label}</strong><small>{item.category}</small></span>
              <span className={`parent-item-state parent-item-state--${item.status}`}>{item.status === 'packed' ? 'Dans la valise' : item.status === 'pending' ? 'À préparer' : item.status === 'not_found' ? 'Introuvable' : 'Manquant'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
