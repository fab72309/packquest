import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  PackageCheck,
  Plus,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router'
import { useDemoMission } from '../../state/DemoMissionContext'

export function ParentDashboardPage() {
  const { mission, helpRequests } = useDemoMission()
  const total = mission.items.length
  const packed = mission.items.filter((item) => item.status === 'packed').length
  const treated = mission.items.filter((item) => item.status !== 'pending').length
  const issues = mission.items.filter((item) => item.status === 'not_found' || item.status === 'missing')
  const progress = total ? Math.round((treated / total) * 100) : 0
  const requestsToAnswer = helpRequests.filter((request) => !request.response).length
  const missionMessage = mission.stage === 'sent'
    ? 'La mission est envoyée à Noa. Vous pourrez suivre sa préparation ici.'
    : mission.stage === 'preparation-recorded'
      ? 'Noa a renseigné sa préparation. Vérifiez les affaires signalées si nécessaire.'
      : 'Noa prépare sa mission. Retrouvez ici ce qui a besoin de votre aide.'

  return (
    <div className="page parent-page">
      <div className="page-heading page-heading--spread">
        <div>
          <p className="eyebrow"><span className="eyebrow-dot" /> VOTRE ESPACE</p>
          <h1>Bonjour, Camille<span className="heading-period">.</span></h1>
          <p className="page-subtitle">{missionMessage}</p>
        </div>
        <Link className="button button--primary" to="/parent/new">
          <Plus size={18} aria-hidden="true" /> Préparer une mission
        </Link>
      </div>

      <section className="parent-hero" aria-labelledby="active-mission-title">
        <div className="parent-hero__content">
          <div className="hero-kicker"><span className="hero-kicker__icon"><Sparkles size={14} aria-hidden="true" /></span> QUÊTE DE NOA · SUIVI PARENT</div>
          <h2 id="active-mission-title">{mission.title}</h2>
          <p className="parent-hero__meta"><span className="avatar avatar--hero">N</span> Pour Noa <span className="meta-divider" /> {mission.period}</p>
          <div className="hero-progress-label"><span>Affaires indiquées</span><strong>{progress}%</strong></div>
          <div className="progress-track progress-track--hero" role="progressbar" aria-label="Affaires indiquées par Noa" aria-valuenow={treated} aria-valuemin={0} aria-valuemax={total}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="parent-hero__count">{treated} sur {total} affaires indiquées · {packed} dans la valise</p>
          <div className="parent-hero__actions">
            <Link className="button button--light" to="/parent/mission">Suivre la mission <ArrowRight size={17} aria-hidden="true" /></Link>
            <Link className="button button--ghost-light" to="/demo/child">Voir l’aperçu enfant</Link>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="hero-orbit__ring hero-orbit__ring--outer" />
          <div className="hero-orbit__ring hero-orbit__ring--inner" />
          <div className="hero-orbit__core"><PackageCheck size={39} strokeWidth={1.5} /></div>
          <span className="hero-orbit__spark hero-orbit__spark--one" />
          <span className="hero-orbit__spark hero-orbit__spark--two" />
          <span className="hero-orbit__spark hero-orbit__spark--three" />
        </div>
      </section>

      <section className="stats-grid" aria-label="Résumé de la mission">
        <article className="stat-card">
          <div className="stat-card__icon stat-card__icon--mint"><CircleCheck size={19} aria-hidden="true" /></div>
          <div><span>Dans la valise</span><strong>{packed}<small> / {total}</small></strong></div>
          <span className="stat-card__caption">affaires rangées</span>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon stat-card__icon--amber"><CircleAlert size={19} aria-hidden="true" /></div>
          <div><span>À regarder</span><strong>{issues.length}<small> affaire{issues.length > 1 ? 's' : ''}</small></strong></div>
          <span className="stat-card__caption">signalées par Noa</span>
        </article>
        <article className="stat-card">
          <div className="stat-card__icon stat-card__icon--lilac"><Clock3 size={19} aria-hidden="true" /></div>
          <div><span>Aide demandée</span><strong>{requestsToAnswer}<small> demande{requestsToAnswer > 1 ? 's' : ''}</small></strong></div>
          <span className="stat-card__caption">dans cette mission</span>
        </article>
      </section>

      <section className="dashboard-lower">
        <div className="section-heading">
          <div><p className="eyebrow">EN UN COUP D’ŒIL</p><h2>Les affaires à suivre</h2></div>
          <Link className="text-link" to="/parent/mission">Voir tout <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        {issues.length > 0 ? (
          <div className="issue-list">
            {issues.slice(0, 3).map((item) => (
              <Link className="issue-row" to={`/parent/mission#issue-${item.id}`} key={item.id}>
                <span className={`issue-marker issue-marker--${item.status}`} aria-hidden="true">
                  {item.status === 'not_found' ? <CircleAlert size={17} /> : <PackageCheck size={17} />}
                </span>
                <span className="issue-row__copy"><strong>{item.label}</strong><small>{item.category}{item.quantity ? ` · quantité ${item.quantity}` : ''}</small></span>
                <span className={`status-pill status-pill--${item.status}`}>{item.status === 'not_found' ? 'Introuvable' : 'Manquant'}</span>
                <ArrowRight className="issue-row__arrow" size={17} aria-hidden="true" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty-state"><CircleCheck size={21} aria-hidden="true" /><p>Aucune affaire signalée.</p></div>
        )}
      </section>

    </div>
  )
}
