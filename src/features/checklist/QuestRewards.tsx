import { Compass, FlagTriangleRight, Sparkles, type LucideIcon } from 'lucide-react'

type Reward = {
  name: string
  description: string
  Icon: LucideIcon
  required: (total: number) => number
}

const rewards: Reward[] = [
  { name: 'Éclat du départ', description: 'Première affaire vérifiée', Icon: Sparkles, required: () => 1 },
  { name: 'Boussole du sac', description: 'La moitié de la quête', Icon: Compass, required: (total) => Math.min(total, Math.max(2, Math.ceil(total / 2))) },
  { name: 'Fanion d’explorateur', description: 'Toutes les affaires indiquées', Icon: FlagTriangleRight, required: (total) => total },
]

export function QuestRewards({ handled, total, compact = false }: { handled: number; total: number; compact?: boolean }) {
  const next = total > 0 ? rewards.find((reward) => handled < reward.required(total)) : undefined

  return (
    <section className={`quest-rewards${compact ? ' quest-rewards--compact' : ''}`} aria-labelledby={compact ? 'quest-rewards-mission' : 'quest-rewards-home'}>
      <div className="quest-rewards__heading">
        <div>
          <span className="quest-kicker">COLLECTION DE LA QUÊTE · DÉMO</span>
          <h2 id={compact ? 'quest-rewards-mission' : 'quest-rewards-home'}>Tes objets de mission</h2>
        </div>
        <span className="quest-rewards__count">{rewards.filter((reward) => total > 0 && handled >= reward.required(total)).length} / {rewards.length}</span>
      </div>
      <p className="quest-rewards__intro">Chaque affaire indiquée fait avancer la quête, même si tu as besoin d’aide.</p>
      <div className="quest-rewards__grid">
        {rewards.map(({ name, description, Icon, required }) => {
          const unlocked = total > 0 && handled >= required(total)
          return (
            <div className={`quest-reward${unlocked ? ' is-unlocked' : ''}`} key={name}>
              <span className="quest-reward__icon"><Icon size={25} aria-hidden={true} /></span>
              <strong>{name}</strong>
              <small>{unlocked ? 'Débloqué · ' : `${required(total)} affaire${required(total) > 1 ? 's' : ''} · `}{description.toLowerCase()}</small>
            </div>
          )
        })}
      </div>
      <p className="quest-rewards__next" aria-live="polite">
        {total === 0 ? 'Aucune affaire dans cette mission.' : next ? `Prochain objet : ${next.name} dans ${next.required(total) - handled} affaire${next.required(total) - handled > 1 ? 's' : ''} indiquée${next.required(total) - handled > 1 ? 's' : ''}.` : 'Collection complète pour cette mission !'}
      </p>
    </section>
  )
}
