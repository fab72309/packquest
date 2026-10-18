import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import { ArrowRight, LogOut } from 'lucide-react'
import { Link, useBeforeUnload, useBlocker } from 'react-router'
import type { TemplateDefinition, TemplateItem } from '../../domain/template'
import { getAuthRedirectUrl } from '../../lib/appUrl'
import type { Database } from '../../lib/supabase/database.types'
import { isSupabaseConfigured, supabase } from '../../lib/supabase/client'
import { loadLocalDemoTemplateDefinitions, saveLocalDemoTemplateDefinitions } from '../../services/demoTemplateStorage'
import { createTemplate, loadTemplateLibrary, saveTemplate } from '../../services/templateLibraryService'
import { TemplateLibraryPage } from './TemplateLibraryPage'
import './ParentTemplateLibraryRoute.css'

type Client = SupabaseClient<Database>

function useUnsavedTemplateWarning(hasUnsavedChanges: boolean) {
  const blocker = useBlocker(hasUnsavedChanges)
  useBeforeUnload(useCallback((event) => {
    if (!hasUnsavedChanges) return
    event.preventDefault()
    event.returnValue = ''
  }, [hasUnsavedChanges]))
  return blocker
}

function UnsavedTemplateDialog({ blocker }: { blocker: ReturnType<typeof useBlocker> }) {
  if (blocker.state !== 'blocked') return null
  return (
    <div className="template-unsaved-overlay">
      <div className="template-unsaved-dialog" role="alertdialog" aria-modal="true" aria-labelledby="template-unsaved-title" aria-describedby="template-unsaved-description" onKeyDown={(event) => { if (event.key === 'Escape') blocker.reset() }}>
        <h2 id="template-unsaved-title">Quitter sans enregistrer ?</h2>
        <p id="template-unsaved-description">Vos modifications de listes seront perdues.</p>
        <div className="template-unsaved-actions">
          <button type="button" autoFocus onClick={() => blocker.reset()}>Rester et enregistrer</button>
          <button type="button" onClick={() => blocker.proceed()}>Quitter sans enregistrer</button>
        </div>
      </div>
    </div>
  )
}

export function ParentTemplateLibraryRoute({ demo = false }: { demo?: boolean }) {
  if (demo) return <LocalDemoTemplateLibrary />
  if (!isSupabaseConfigured || !supabase) return <SupabaseSetupRequired />
  return <ConnectedTemplateLibrary client={supabase} />
}

function LocalDemoTemplateLibrary() {
  const [templates, setTemplates] = useState(loadLocalDemoTemplateDefinitions)
  const [selectedTemplateId, setSelectedTemplateId] = useState(() => loadLocalDemoTemplateDefinitions()[0]?.id ?? null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [dirtyTemplateIds, setDirtyTemplateIds] = useState<Set<string>>(() => new Set())
  const blocker = useUnsavedTemplateWarning(dirtyTemplateIds.size > 0)

  function markDirty(templateId: string) {
    setDirtyTemplateIds((current) => new Set(current).add(templateId))
  }

  function createLocalTemplate() {
    const id = globalThis.crypto?.randomUUID?.()
      ?? `local-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const template: TemplateDefinition = {
      id,
      name: 'Nouvelle liste',
      description: '',
      period: 'Semaine prochaine',
      version: 1,
      items: [],
    }
    setTemplates((current) => [...current, template])
    setSelectedTemplateId(template.id)
    markDirty(template.id)
    setSaveError(null)
    setSaveSuccess(null)
  }

  function updateTemplate(templateId: string, updates: Partial<Pick<TemplateDefinition, 'name' | 'description'>>) {
    markDirty(templateId)
    setTemplates((current) => current.map((template) => template.id === templateId ? { ...template, ...updates } : template))
    setSaveError(null)
    setSaveSuccess(null)
  }

  function updateItem(templateId: string, itemId: string, updates: Partial<Pick<TemplateItem, 'category' | 'label' | 'quantity' | 'required'>>) {
    markDirty(templateId)
    setTemplates((current) => current.map((template) => template.id !== templateId ? template : {
      ...template,
      items: template.items.map((item) => item.id === itemId ? { ...item, ...updates } : item),
    }))
    setSaveError(null)
    setSaveSuccess(null)
  }

  function addItem(templateId: string, item: TemplateItem) {
    markDirty(templateId)
    setTemplates((current) => current.map((template) => template.id !== templateId ? template : {
      ...template,
      items: [...template.items, item],
    }))
    setSaveError(null)
    setSaveSuccess(null)
  }

  function removeItem(templateId: string, itemId: string) {
    markDirty(templateId)
    setTemplates((current) => current.map((template) => template.id !== templateId ? template : {
      ...template,
      items: template.items.filter((item) => item.id !== itemId),
    }))
    setSaveError(null)
    setSaveSuccess(null)
  }

  function persistTemplate(templateId: string) {
    const templateToSave = templates.find((template) => template.id === templateId)
    if (!templateToSave) return

    try {
      const savedTemplates = loadLocalDemoTemplateDefinitions()
      const existingIndex = savedTemplates.findIndex((template) => template.id === templateId)
      if (existingIndex >= 0) savedTemplates[existingIndex] = templateToSave
      else savedTemplates.push(templateToSave)
      saveLocalDemoTemplateDefinitions(savedTemplates)
      setDirtyTemplateIds((current) => { const next = new Set(current); next.delete(templateId); return next })
      setSaveError(null)
      setSaveSuccess('Liste enregistrée sur cet appareil.')
    } catch {
      setSaveSuccess(null)
      setSaveError('La liste n’a pas pu être enregistrée dans ce navigateur.')
    }
  }

  return (
    <div className="template-account-page">
      <UnsavedTemplateDialog blocker={blocker} />
      <TemplateLibraryPage
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        dirtyTemplateIds={dirtyTemplateIds}
        onCreateTemplate={createLocalTemplate}
        onSelect={(id) => { setSelectedTemplateId(id); setSaveError(null); setSaveSuccess(null) }}
        onUpdateTemplate={updateTemplate}
        onUpdateItem={updateItem}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onSave={persistTemplate}
        saving={false}
        saveError={saveError}
        saveSuccess={saveSuccess}
        saveNote="Enregistrez vos changements avant de quitter cette page. Les listes enregistrées restent sur cet appareil et servent aux missions de test."
      />
    </div>
  )
}

function SupabaseSetupRequired() {
  return (
    <section className="template-account-state" aria-labelledby="template-account-title">
      <p className="template-account-state__eyebrow">COMPTE PARENT</p>
      <h1 id="template-account-title">Listes indisponibles</h1>
      <p>Les listes du compte ne sont pas accessibles pour le moment.</p>
      <Link className="button button--secondary" to="/parent/account">Revenir à mon compte <ArrowRight size={16} aria-hidden="true" /></Link>
    </section>
  )
}

function ConnectedTemplateLibrary({ client }: { client: Client }) {
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authNotice, setAuthNotice] = useState<string | null>(null)
  const [templates, setTemplates] = useState<TemplateDefinition[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [savingTemplateId, setSavingTemplateId] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const [dirtyTemplateIds, setDirtyTemplateIds] = useState<Set<string>>(() => new Set())
  const blocker = useUnsavedTemplateWarning(dirtyTemplateIds.size > 0)
  const userId = session?.user.id

  function markDirty(templateId: string) {
    setDirtyTemplateIds((current) => new Set(current).add(templateId))
  }

  useEffect(() => {
    let active = true
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
      setCheckingSession(false)
      setAuthError(null)
    })

    void client.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return
        setSession(data.session)
        setCheckingSession(false)
        if (error) setAuthError('La session ne peut pas être vérifiée. Réessayez.')
      })
      .catch(() => {
        if (!active) return
        setCheckingSession(false)
        setAuthError('La session ne peut pas être vérifiée. Réessayez.')
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [client])

  useEffect(() => {
    let active = true
    if (!userId) {
      setTemplates([])
      setSelectedTemplateId(null)
      setLoadingTemplates(false)
      setDirtyTemplateIds(new Set())
      return
    }

    setLoadingTemplates(true)
    setLoadError(null)
    void loadTemplateLibrary(client, userId)
      .then((loadedTemplates) => {
        if (!active) return
        setTemplates(loadedTemplates)
        setDirtyTemplateIds(new Set())
        setSelectedTemplateId((current) => loadedTemplates.some((template) => template.id === current)
          ? current
          : loadedTemplates[0]?.id ?? null)
      })
      .catch(() => {
        if (active) setLoadError('Impossible de charger vos listes pour le moment. Réessayez dans quelques instants.')
      })
      .finally(() => {
        if (active) setLoadingTemplates(false)
      })

    return () => { active = false }
  }, [client, userId])

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAuthBusy(true)
    setAuthError(null)
    setAuthNotice(null)
    try {
      if (authMode === 'sign-up') {
        const { data, error } = await client.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: getAuthRedirectUrl('/parent/templates') },
        })
        if (error) throw error
        if (!data.session) setAuthNotice('Un lien de confirmation a été envoyé à cette adresse.')
      } else {
        const { error } = await client.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message.toLowerCase() : ''
      setAuthError(reason.includes('invalid login') ? 'Adresse e-mail ou mot de passe incorrect.'
        : reason.includes('email not confirmed') ? 'Confirmez votre adresse e-mail avant de vous connecter.'
          : 'La connexion a échoué. Vérifiez vos informations et réessayez.')
    } finally {
      setAuthBusy(false)
    }
  }

  async function signOut() {
    if (dirtyTemplateIds.size > 0 && !window.confirm('Des modifications de liste ne sont pas enregistrées. Se déconnecter ?')) return
    setAuthError(null)
    const { error } = await client.auth.signOut()
    if (error) setAuthError('La déconnexion a échoué. Réessayez.')
  }

  async function signInWithGoogle() {
    setAuthBusy(true)
    setAuthError(null)
    try {
      const native = Capacitor.isNativePlatform()
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: getAuthRedirectUrl('/parent/templates'), skipBrowserRedirect: native },
      })
      if (error) throw error
      if (native) {
        if (!data.url) throw new Error('OAuth URL missing')
        await Browser.open({ url: data.url })
      }
    } catch {
      setAuthError('La connexion Google est indisponible pour le moment.')
    } finally {
      setAuthBusy(false)
    }
  }

  function updateTemplate(templateId: string, updates: Partial<Pick<TemplateDefinition, 'name' | 'description'>>) {
    markDirty(templateId)
    setTemplates((current) => current.map((template) => template.id === templateId ? { ...template, ...updates } : template))
    setSaveError(null)
    setSaveSuccess(null)
  }

  async function createConnectedTemplate() {
    if (!userId || savingTemplateId) return
    setSavingTemplateId('creating')
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const created = await createTemplate(client, userId)
      setTemplates((current) => [...current, created])
      setSelectedTemplateId(created.id)
      setSaveSuccess('Liste créée. Ajoutez vos premières affaires.')
    } catch {
      setSaveError('La nouvelle liste n’a pas pu être créée. Réessayez.')
    } finally {
      setSavingTemplateId(null)
    }
  }

  function updateItem(templateId: string, itemId: string, updates: Partial<Pick<TemplateItem, 'category' | 'label' | 'quantity' | 'required'>>) {
    markDirty(templateId)
    setTemplates((current) => current.map((template) => template.id !== templateId ? template : {
      ...template,
      items: template.items.map((item) => item.id === itemId ? { ...item, ...updates } : item),
    }))
    setSaveError(null)
    setSaveSuccess(null)
  }

  function addItem(templateId: string, item: TemplateItem) {
    markDirty(templateId)
    setTemplates((current) => current.map((template) => template.id !== templateId ? template : {
      ...template,
      items: [...template.items, item],
    }))
    setSaveError(null)
    setSaveSuccess(null)
  }

  function removeItem(templateId: string, itemId: string) {
    markDirty(templateId)
    setTemplates((current) => current.map((template) => template.id !== templateId ? template : {
      ...template,
      items: template.items.filter((item) => item.id !== itemId),
    }))
    setSaveError(null)
    setSaveSuccess(null)
  }

  async function persistTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId)
    if (!template) return
    setSavingTemplateId(templateId)
    setSaveError(null)
    setSaveSuccess(null)
    try {
      const version = await saveTemplate(client, template)
      setTemplates((current) => current.map((saved) => saved.id === templateId ? { ...saved, version } : saved))
      setDirtyTemplateIds((current) => { const next = new Set(current); next.delete(templateId); return next })
      setSaveSuccess('Liste enregistrée sur votre compte.')
    } catch (error) {
      setSaveError(error instanceof Error && error.message.includes('changed')
        ? 'Cette liste a été modifiée dans un autre onglet. Rechargez la page pour récupérer la dernière version.'
        : 'La liste n’a pas pu être enregistrée. Vérifiez les champs et réessayez.')
    } finally {
      setSavingTemplateId(null)
    }
  }

  if (checkingSession) {
    return <div className="template-account-state" role="status">Vérification du compte…</div>
  }

  if (!session) {
    return (
      <section className="template-auth-card" aria-labelledby="template-auth-title">
        <p className="template-account-state__eyebrow">COMPTE PARENT</p>
        <h1 id="template-auth-title">{authMode === 'sign-in' ? 'Se connecter' : 'Créer un compte'}</h1>
        <button className="account-google" type="button" disabled={authBusy} onClick={() => void signInWithGoogle()}><span className="account-google__mark">G</span> Continuer avec Google</button>
        <div className="account-divider"><span>ou avec mon e-mail</span></div>
        <form className="template-auth-form" onSubmit={(event) => void submitAuth(event)}>
          <label><span>Adresse e-mail</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label><span>Mot de passe</span><input type="password" autoComplete={authMode === 'sign-in' ? 'current-password' : 'new-password'} minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {authMode === 'sign-up' && <p className="account-privacy">Vos données personnelles servent au fonctionnement de PackQuest. Nous ne les exploitons pas à des fins commerciales : ni vente, ni publicité ciblée.</p>}
          {authError && <p className="template-account-error" role="alert">{authError}</p>}
          {authNotice && <p className="template-account-success" role="status">{authNotice}</p>}
          <button className="button button--primary" type="submit" disabled={authBusy}>
            {authBusy ? 'Veuillez patienter…' : authMode === 'sign-in' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
        <button className="template-auth-toggle" type="button" onClick={() => {
          setAuthMode((current) => current === 'sign-in' ? 'sign-up' : 'sign-in')
          setAuthError(null)
          setAuthNotice(null)
        }}>
          {authMode === 'sign-in' ? 'Créer un compte parent' : 'J’ai déjà un compte'}
        </button>
      </section>
    )
  }

  return (
    <div className="template-account-page">
      <UnsavedTemplateDialog blocker={blocker} />
      <div className="template-account-toolbar">
        <span>Connecté : {session.user.email}</span>
        <button type="button" onClick={() => void signOut()}><LogOut size={16} aria-hidden="true" /> Déconnexion</button>
      </div>
      {loadingTemplates ? (
        <div className="template-account-state" role="status">Chargement des listes…</div>
      ) : loadError ? (
        <section className="template-account-state" role="alert">
          <h1>Listes indisponibles</h1>
          <p>{loadError}</p>
          <button className="button button--secondary" type="button" onClick={() => window.location.reload()}>Réessayer</button>
        </section>
      ) : (
        <TemplateLibraryPage
          templates={templates}
          selectedTemplateId={selectedTemplateId}
          dirtyTemplateIds={dirtyTemplateIds}
          creating={savingTemplateId === 'creating'}
          onCreateTemplate={() => void createConnectedTemplate()}
          onSelect={(id) => { setSelectedTemplateId(id); setSaveError(null); setSaveSuccess(null) }}
          onUpdateTemplate={updateTemplate}
          onUpdateItem={updateItem}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onSave={(id) => void persistTemplate(id)}
          saving={savingTemplateId !== null}
          saveError={saveError}
          saveSuccess={saveSuccess}
        />
      )}
      {authError && <p className="template-account-error" role="alert">{authError}</p>}
    </div>
  )
}
