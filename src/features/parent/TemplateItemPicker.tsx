import { useId } from 'react'
import type { ReactNode } from 'react'
import './TemplateItemPicker.css'

export type TemplateItemOption = {
  id: string
  category: string
  label: string
  quantity?: number
  required?: boolean
}

type TemplateItemPickerProps = {
  items: readonly TemplateItemOption[]
  selectedItemIds: readonly string[]
  onToggleItem: (itemId: string, selected: boolean) => void
  onSetAll: (selected: boolean) => void
  disabled?: boolean
  heading?: ReactNode
}

export function TemplateItemPicker({
  items,
  selectedItemIds,
  onToggleItem,
  onSetAll,
  disabled = false,
  heading = 'Affaires à emporter',
}: TemplateItemPickerProps) {
  const idPrefix = useId()
  const selectedIds = new Set(selectedItemIds)
  const selectedCount = items.filter((item) => selectedIds.has(item.id)).length
  const allSelected = items.length > 0 && selectedCount === items.length
  const categories = new Map<string, TemplateItemOption[]>()

  for (const item of items) {
    const categoryItems = categories.get(item.category) ?? []
    categoryItems.push(item)
    categories.set(item.category, categoryItems)
  }

  return (
    <section className="mission-item-picker" aria-labelledby={`${idPrefix}-heading`}>
      <div className="mission-item-picker__heading">
        <div>
          <h2 id={`${idPrefix}-heading`}>{heading}</h2>
          <p>Choisissez ce que votre enfant devra mettre dans sa valise. Cette sélection ne modifie pas le modèle.</p>
        </div>
        <span className="mission-item-picker__count" aria-live="polite">
          {selectedCount} affaire{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''} sur {items.length}
        </span>
      </div>

      {items.length > 0 ? (
        <>
          <div className="mission-item-picker__actions" role="group" aria-label="Sélection des affaires">
            <button type="button" onClick={() => onSetAll(true)} disabled={disabled || allSelected}>
              Tout sélectionner
            </button>
            <button type="button" onClick={() => onSetAll(false)} disabled={disabled || selectedCount === 0}>
              Tout retirer
            </button>
          </div>

          <div className="mission-item-picker__categories">
            {[...categories.entries()].map(([category, categoryItems]) => (
              <fieldset className="mission-item-picker__category" key={category} disabled={disabled}>
                <legend>
                  <span>{category}</span>
                  <small>{categoryItems.filter((item) => selectedIds.has(item.id)).length}/{categoryItems.length}</small>
                </legend>
                <div className="mission-item-picker__items">
                  {categoryItems.map((item) => {
                    const itemId = `${idPrefix}-${item.id}`
                    const selected = selectedIds.has(item.id)

                    return (
                      <label className={`mission-item-picker__item${selected ? ' is-selected' : ''}`} htmlFor={itemId} key={item.id}>
                        <input
                          id={itemId}
                          type="checkbox"
                          checked={selected}
                          onChange={(event) => onToggleItem(item.id, event.target.checked)}
                        />
                        <span className="mission-item-picker__item-copy">
                          <strong>{item.label}</strong>
                          {item.quantity !== undefined && <small>{item.quantity} {item.quantity > 1 ? 'exemplaires' : 'exemplaire'}</small>}
                        </span>
                        {item.required && <span className="mission-item-picker__essential">Indispensable</span>}
                      </label>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
          {selectedCount === 0 && <p className="mission-item-picker__selection-help" role="status">Choisissez au moins une affaire pour envoyer la mission.</p>}
        </>
      ) : (
        <p className="mission-item-picker__empty">Ce modèle ne contient aucune affaire. Ajoutez-en dans la bibliothèque des modèles pour créer la mission.</p>
      )}
    </section>
  )
}
