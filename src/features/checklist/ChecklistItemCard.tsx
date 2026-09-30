import { CircleHelp, CircleMinus, Check } from 'lucide-react'
import type { ChecklistItemStatus } from '../../domain/types'
import './ChecklistItemCard.css'

export type { ChecklistItemStatus }

export type ChecklistItemCardProps = {
  label: string
  quantity?: number
  status: ChecklistItemStatus
  onStatusChange: (nextStatus: ChecklistItemStatus) => void
  disabled?: boolean
}

const statusLabels: Record<ChecklistItemStatus, string> = {
  pending: 'À préparer',
  packed: 'Dans la valise',
  not_found: 'Introuvable',
  missing: 'Manquant',
}

const actions = [
  { status: 'packed', label: 'C’est rangé', Icon: Check },
  { status: 'not_found', label: 'Je ne trouve pas', Icon: CircleHelp },
  { status: 'missing', label: 'Il n’y en a plus', Icon: CircleMinus },
] as const

export function ChecklistItemCard({
  label,
  quantity,
  status,
  onStatusChange,
  disabled = false,
}: ChecklistItemCardProps) {
  return (
    <article className={`pq-item-card pq-item-card--${status}`}>
      <div className="pq-item-card__details">
        <span className="pq-item-card__item-number" aria-hidden="true"><Check size={18} /></span>
        <span className="pq-item-card__label">{label}</span>
        {quantity !== undefined && (
          <span className="pq-item-card__quantity">× {quantity}</span>
        )}
        <span className="pq-item-card__status" aria-live="polite">
          {statusLabels[status]}
        </span>
      </div>

      <div className="pq-item-card__actions" role="group" aria-label={`État de ${label}`}>
        {actions.map(({ status: actionStatus, label: actionLabel, Icon }) => {
          const selected = status === actionStatus
          return (
            <button
              key={actionStatus}
              type="button"
              className={`pq-item-card__action${selected ? ' pq-item-card__action--selected' : ''}`}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onStatusChange(selected ? 'pending' : actionStatus)}
            >
              <Icon aria-hidden="true" size={19} strokeWidth={2.25} />
              <span>{actionLabel}</span>
            </button>
          )
        })}
      </div>
    </article>
  )
}
