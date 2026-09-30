import { useId } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import type { TemplateDefinition as EditableTemplate, TemplateItem as EditableTemplateItem } from '../../domain/template'
import './TemplateLibraryPage.css'

export type { EditableTemplate, EditableTemplateItem }

export type TemplateLibraryPageProps = {
  templates: EditableTemplate[]
  selectedTemplateId: string | null
  dirtyTemplateIds: ReadonlySet<string>
  onSelect: (templateId: string) => void
  onUpdateTemplate: (templateId: string, updates: Partial<Pick<EditableTemplate, 'name' | 'description'>>) => void
  onUpdateItem: (templateId: string, itemId: string, updates: Partial<Pick<EditableTemplateItem, 'category' | 'label' | 'quantity' | 'required'>>) => void
  onAddItem: (templateId: string, item: EditableTemplateItem) => void
  onRemoveItem: (templateId: string, itemId: string) => void
  onSave: (templateId: string) => void
  saving: boolean
  saveError: string | null
  saveSuccess?: string | null
  saveNote?: string
}

export function TemplateLibraryPage({
  templates,
  selectedTemplateId,
  dirtyTemplateIds,
  onSelect,
  onUpdateTemplate,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onSave,
  saving,
  saveError,
  saveSuccess,
  saveNote = 'Enregistrez vos changements avant de quitter cette page. Les modèles enregistrés resteront disponibles à votre prochaine connexion.',
}: TemplateLibraryPageProps) {
  const idPrefix = useId()
  const selected = templates.find((template) => template.id === selectedTemplateId)
  const contentIsValid = selected !== undefined
    && selected.name.trim().length > 0
    && selected.name.trim().length <= 100
    && selected.description.length <= 240
    && selected.items.length > 0
    && selected.items.every((item) => item.label.trim().length > 0
      && item.label.trim().length <= 100
      && item.category.trim().length > 0
      && item.category.trim().length <= 60
      && Number.isInteger(item.quantity)
      && item.quantity >= 1
      && item.quantity <= 999)
  const validationMessage = !selected ? null
    : !selected.name.trim() ? 'Donnez un nom au modèle.'
      : selected.name.trim().length > 100 ? 'Le nom doit contenir 100 caractères maximum.'
        : selected.description.length > 240 ? 'La description doit contenir 240 caractères maximum.'
          : selected.items.length === 0 ? 'Ajoutez au moins une affaire pour utiliser ce modèle.'
            : selected.items.some((item) => !item.label.trim()) ? 'Donnez un nom à chaque affaire.'
              : selected.items.some((item) => !item.category.trim()) ? 'Indiquez une catégorie pour chaque affaire.'
                : selected.items.some((item) => item.label.trim().length > 100 || item.category.trim().length > 60) ? 'Un libellé ou une catégorie est trop long.'
                  : selected.items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) ? 'Chaque quantité doit être comprise entre 1 et 999.'
                    : null

  const addItem = () => {
    if (!selected) return
    const randomId = globalThis.crypto?.randomUUID?.()
      ?? 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
        const random = Math.floor(Math.random() * 16)
        return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16)
      })
    onAddItem(selected.id, {
      id: randomId,
      category: 'À classer',
      label: '',
      quantity: 1,
      required: false,
      position: Math.max(-1, ...selected.items.map((item) => item.position)) + 1,
    })
  }

  return (
    <div className="template-library">
      <header className="template-library__heading">
        <p className="template-library__eyebrow">ESPACE PARENT · ORGANISATION</p>
        <h1>Mes modèles</h1>
        <p>Gérez les listes réutilisables pour vos prochaines missions.</p>
      </header>

      {templates.length === 0 ? (
        <section className="template-library__empty" aria-live="polite">
          <span aria-hidden="true">✦</span>
          <h2>Aucun modèle pour le moment</h2>
          <p>Les modèles disponibles apparaîtront ici.</p>
        </section>
      ) : (
        <div className="template-library__layout">
          <nav className="template-library__list" aria-label="Modèles de checklist">
            <p className="template-library__section-label">VOTRE BIBLIOTHÈQUE</p>
            {templates.map((template) => (
              <button
                className={`template-library__choice${template.id === selectedTemplateId ? ' is-selected' : ''}`}
                type="button"
                key={template.id}
                onClick={() => onSelect(template.id)}
                aria-pressed={template.id === selectedTemplateId}
              >
                <span className="template-library__choice-icon" aria-hidden="true">✦</span>
                <span className="template-library__choice-copy">
                  <strong>{template.name || 'Sans nom'}</strong>
                  <small>{template.items.length} affaire{template.items.length > 1 ? 's' : ''} · {template.period}</small>
                  {dirtyTemplateIds.has(template.id) && <small className="template-library__unsaved">Non enregistré</small>}
                </span>
                <span className="template-library__choice-arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </nav>

          {selected && (
            <section className="template-library__editor" aria-labelledby="template-editor-title">
              <div className="template-library__editor-top">
                <div>
                  <p className="template-library__section-label">MODÈLE · {selected.period.toUpperCase()}</p>
                  <h2 id="template-editor-title">Modifier le modèle</h2>
                </div>
                <span className="template-library__badge">{dirtyTemplateIds.has(selected.id) ? 'Modifié' : `${selected.items.length} affaires`}</span>
              </div>

              <div className="template-library__fields">
                <label className="template-library__field">
                  <span>Nom du modèle</span>
                  <input value={selected.name} maxLength={100} disabled={saving} onChange={(event) => onUpdateTemplate(selected.id, { name: event.target.value })} placeholder="Ex. Sac du week-end" />
                </label>
                <label className="template-library__field">
                  <span>Description</span>
                  <textarea value={selected.description} maxLength={240} disabled={saving} onChange={(event) => onUpdateTemplate(selected.id, { description: event.target.value })} placeholder="À quoi sert ce modèle ?" rows={2} />
                </label>
              </div>

              <div className="template-library__items-heading">
                <div><h3>Affaires à préparer</h3><p>Ajoutez les essentiels et indiquez ce qui est indispensable.</p></div>
                <button className="template-library__add" type="button" onClick={addItem} disabled={saving}><Plus size={17} aria-hidden="true" /> Ajouter</button>
              </div>

              <div className="template-library__items">
                {selected.items.slice().sort((a, b) => a.position - b.position).map((item, index) => {
                  const itemId = `${idPrefix}-${item.id}`
                  return (
                    <article className="template-library__item" key={item.id}>
                      <span className="template-library__item-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <div className="template-library__item-fields">
                        <label className="template-library__field">
                          <span>Affaire</span>
                          <input aria-label="Libellé de l’affaire" value={item.label} maxLength={100} disabled={saving} onChange={(event) => onUpdateItem(selected.id, item.id, { label: event.target.value })} placeholder="Ex. T-shirt" />
                        </label>
                        <label className="template-library__field">
                          <span>Catégorie</span>
                          <input aria-label="Catégorie de l’affaire" value={item.category} maxLength={60} disabled={saving} onChange={(event) => onUpdateItem(selected.id, item.id, { category: event.target.value })} placeholder="Ex. Vêtements" />
                        </label>
                        <label className="template-library__field template-library__quantity">
                          <span>Quantité</span>
                          <input aria-label="Quantité" disabled={saving} type="number" min="1" max="999" step="1" value={item.quantity} onChange={(event) => onUpdateItem(selected.id, item.id, { quantity: Math.max(1, Number(event.target.value) || 1) })} />
                        </label>
                        <label className="template-library__required" htmlFor={`${itemId}-required`}>
                          <input id={`${itemId}-required`} disabled={saving} type="checkbox" checked={item.required} onChange={(event) => onUpdateItem(selected.id, item.id, { required: event.target.checked })} />
                          <span>Indispensable</span>
                        </label>
                      </div>
                      <button className="template-library__remove" type="button" disabled={saving} aria-label={`Supprimer ${item.label || 'cette affaire'}`} onClick={() => onRemoveItem(selected.id, item.id)}>
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </article>
                  )
                })}
                {selected.items.length === 0 && <p className="template-library__no-items">La checklist est vide. Ajoutez une première affaire.</p>}
              </div>

              <footer className="template-library__footer">
                <p className="template-library__save-note">{saveNote}</p>
                <button className="template-library__save" type="button" onClick={() => onSave(selected.id)} disabled={saving || !contentIsValid}>
                  <Save size={17} aria-hidden="true" /> {saving ? 'Enregistrement…' : 'Enregistrer le modèle'}
                </button>
              </footer>
              {validationMessage && <p className="template-library__validation" role="status">{validationMessage}</p>}
              {saveError && <p className="template-library__error" role="alert">{saveError}</p>}
              {saveSuccess && <p className="template-library__success" role="status">{saveSuccess}</p>}
            </section>
          )}
        </div>
      )}
    </div>
  )
}
