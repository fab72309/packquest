import { ArrowRight, Check, Clock3, Play, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { useDemoMission } from '../../state/DemoMissionContext'
import { QuestRewards } from './QuestRewards'

export function ChildHomePage() {
  const { mission, rewardProgress, startMission } = useDemoMission()
  const total = mission.items.length
  const packed = mission.items.filter((item) => item.status === 'packed').length
  const handled = mission.items.filter((item) => item.status !== 'pending').length
  const issues = handled - packed
  const progress = total ? Math.round((handled / total) * 100) : 0
  const hasStarted = mission.stage !== 'sent'

  return (
    <div className="child-page child-home-page">
      <header className="child-welcome">
        <div className="child-avatar" aria-hidden="true">N<span className="child-avatar__shine" /></div>
        <div><p className="child-welcome__eyebrow">TON ESPACE · NOA</p><h1>Prêt pour ta quête ?</h1></div>
      </header>

      <section className={`child-mission-card${mission.stage === 'preparation-recorded' ? ' child-mission-card--done' : ''}`} aria-labelledby="child-mission-title">
        <div className="child-mission-card__topline">
          <span className="child-mission-card__tag"><Sparkles size={16} aria-hidden="true" /> QUÊTE DU MOMENT</span>
          <span className="child-mission-card__number">01 / MISSION</span>
        </div>
        <div className="child-mission-card__body">
          <div className="child-mission-card__copy">
            <p className="child-mission-card__overline">{mission.period}</p>
            <h2 id="child-mission-title">{mission.title}</h2>
            <p className="child-mission-card__description">Vérifie tes affaires, une par une. Ton parent peut t’aider si quelque chose manque.</p>
            <div className="child-mission-card__stats" aria-label="Résumé de la mission">
              <span><strong>{packed}</strong> rangée{packed > 1 ? 's' : ''}</span>
              <span><strong>{total - handled}</strong> à vérifier</span>
              {issues > 0 && <span><strong>{issues}</strong> à regarder</span>}
            </div>
          </div>
          <div className="child-mission-card__illustration" aria-hidden="true">
            <span className="bag-ray bag-ray--one" /><span className="bag-ray bag-ray--two" /><span className="bag-ray bag-ray--three" />
            <div className="bag-shape"><div className="bag-shape__handle" /><div className="bag-shape__badge"><Check size={23} /></div><span className="bag-shape__spark bag-shape__spark--a" /><span className="bag-shape__spark bag-shape__spark--b" /></div>
          </div>
        </div>

        {hasStarted && <div className="child-home-progress">
          <div className="child-home-progress__labels"><span>Quête indiquée</span><strong>{handled} / {total}</strong></div>
          <div className="progress-track progress-track--child" role="progressbar" aria-label="Affaires indiquées" aria-valuenow={handled} aria-valuemin={0} aria-valuemax={total}><span style={{ width: `${progress}%` }} /></div>
        </div>}

        <Link className="button button--child-primary" to="/demo/child/mission" onClick={() => { if (!hasStarted) startMission() }}>
          {mission.stage === 'preparation-recorded' ? <><Check size={20} aria-hidden="true" /> Voir ma préparation</> : hasStarted ? <><ArrowRight size={20} aria-hidden="true" /> Continuer la quête</> : <><Play size={19} fill="currentColor" aria-hidden="true" /> Commencer la quête</>}
        </Link>
        <div className="child-mission-card__footer"><Clock3 size={16} aria-hidden="true" /> Aucun chrono. Avance à ton rythme.</div>
      </section>

      <QuestRewards handled={rewardProgress} total={total} />
      <p className="child-disclaimer">Objets visuels de démonstration · aucune récompense enregistrée après rechargement</p>
    </div>
  )
}
