import { useEffect, useState, type FormEvent } from 'react'
import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'
import type { Session } from '@supabase/supabase-js'
import { ArrowRight, History, LogOut, QrCode, ShieldCheck, Sparkles, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { getAuthRedirectUrl } from '../../lib/appUrl'
import { isSupabaseConfigured, supabase } from '../../lib/supabase/client'
import { forgetChildDevice } from '../../services/childOfflineService'
import { parentAction } from '../../services/parentApi'
import './ParentAccountPage.css'

type AuthMode = 'sign-in' | 'sign-up' | 'reset' | 'new-password'

export function ParentAccountPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [privacyNoticeRead, setPrivacyNoticeRead] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  useEffect(() => {
    if (!supabase) return
    let active = true
    const onAuthCallbackError = () => {
      window.sessionStorage.removeItem('packquest.auth.callback.error')
      setError('La connexion ne s’est pas terminée. Réessayez.')
    }
    window.addEventListener('packquest:auth-error', onAuthCallbackError)
    if (window.sessionStorage.getItem('packquest.auth.callback.error')) {
      window.sessionStorage.removeItem('packquest.auth.callback.error')
      onAuthCallbackError()
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return
      setSession(next)
      setLoading(false)
      setBusy(false)
      if (event === 'PASSWORD_RECOVERY') setMode('new-password')
    })
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
      if (sessionError) setError('La session ne peut pas être vérifiée. Réessayez.')
    }).catch(() => { if (active) { setLoading(false); setError('La session ne peut pas être vérifiée. Réessayez.') } })
    return () => {
      active = false
      window.removeEventListener('packquest:auth-error', onAuthCallbackError)
      subscription.unsubscribe()
    }
  }, [])

  function changeMode(next: AuthMode) { setMode(next); setError(''); setNotice(''); setPassword('') }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    if (mode === 'sign-up' && !privacyNoticeRead) {
      setError('Lisez puis cochez la notice de confidentialité avant de créer un compte.')
      return
    }
    setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'sign-up') {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: getAuthRedirectUrl('/parent/account') } })
        if (authError) throw authError
        setNotice(data.session ? 'Votre compte parent est créé.' : 'Vérifiez votre boîte mail pour confirmer votre adresse.')
      } else if (mode === 'reset') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: getAuthRedirectUrl('/parent/account') })
        if (authError) throw authError
        setNotice('Si cette adresse correspond à un compte, un lien de réinitialisation a été envoyé.')
      } else if (mode === 'new-password') {
        const { error: authError } = await supabase.auth.updateUser({ password })
        if (authError) throw authError
        setNotice('Votre mot de passe a été modifié.')
        setMode('sign-in')
        setPassword('')
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
      }
    } catch (authError) {
      const message = authError instanceof Error ? authError.message.toLowerCase() : ''
      setError(message.includes('invalid login') ? 'Adresse e-mail ou mot de passe incorrect.' : message.includes('email not confirmed') ? 'Confirmez votre adresse e-mail avant de vous connecter.' : 'Cette opération a échoué. Vérifiez vos informations et réessayez.')
    } finally { setBusy(false) }
  }

  async function signInWithGoogle() {
    if (!supabase) return
    if (!privacyNoticeRead) {
      setError('Lisez puis cochez la notice de confidentialité avant de continuer avec Google.')
      return
    }
    setBusy(true); setError(''); setNotice('')
    try {
      const native = Capacitor.isNativePlatform()
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthRedirectUrl('/parent/account'),
          skipBrowserRedirect: native,
        },
      })
      if (authError) throw authError
      if (native) {
        if (!data.url) throw new Error('OAuth URL missing')
        await Browser.open({ url: data.url })
      }
    } catch {
      setError('La connexion Google est indisponible pour le moment.')
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    if (!supabase) return
    setBusy(true); setError('')
    const { error: authError } = await supabase.auth.signOut()
    if (authError) setError('La déconnexion a échoué. Réessayez.')
    else {
      window.sessionStorage.removeItem('packquest.parent.adult-confirmed')
      window.dispatchEvent(new Event('packquest:adult-session-ended'))
    }
    setBusy(false)
  }

  async function deleteAccount() {
    if (!supabase || deleteConfirmation.trim() !== 'SUPPRIMER') return
    setBusy(true); setError(''); setNotice('')
    try {
      await parentAction<{ deleted: boolean }>('delete_parent_account')
      const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
      window.sessionStorage.removeItem('packquest.parent.adult-confirmed')
      window.dispatchEvent(new Event('packquest:adult-session-ended'))
      let localCleanupIncomplete = Boolean(signOutError)
      try { await forgetChildDevice() } catch { localCleanupIncomplete = true }
      setSession(null)
      setMode('sign-in')
      setDeleteOpen(false)
      setDeleteConfirmation('')
      setNotice(localCleanupIncomplete
        ? 'Le compte et les données en ligne ont été supprimés. Certaines données locales n’ont pas pu être effacées sur cet appareil.'
        : 'Le compte et les données de la famille ont été supprimés.')
    } catch {
      setError('La suppression a échoué. Réessayez.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="account-page"><div className="account-card" role="status">Vérification du compte…</div></div>

  if (!isSupabaseConfigured || !supabase) return <div className="account-page"><section className="account-card"><h1>Compte parent indisponible</h1><p>La connexion sécurisée n’est pas configurée sur cette version.</p><Link className="button button--secondary" to="/">Retour à l’accueil</Link></section></div>

  if (session && mode !== 'new-password') return (
    <div className="account-page"><section className="account-card account-card--wide">
      <p className="account-eyebrow">ESPACE PARENT</p><h1>Bienvenue dans votre famille PackQuest.</h1>
      <p className="account-muted">Connecté avec {session.user.email || 'Google'}. L’enfant n’a pas besoin de compte : vous lui montrez un QR code depuis votre espace.</p>
      <div className="account-actions">
        <Link className="account-action" to="/parent/create"><Sparkles aria-hidden="true" /><span><strong>Préparer une mission</strong><small>Choisir une liste et l’envoyer à mon enfant</small></span><ArrowRight aria-hidden="true" /></Link>
        <Link className="account-action" to="/parent/pairing"><QrCode aria-hidden="true" /><span><strong>Relier l’appareil de mon enfant</strong><small>Créer son profil et afficher un QR code temporaire</small></span><ArrowRight aria-hidden="true" /></Link>
        <Link className="account-action" to="/parent/history"><History aria-hidden="true" /><span><strong>Voir les missions</strong><small>Retrouver les préparations et leur historique</small></span><ArrowRight aria-hidden="true" /></Link>
        <Link className="account-action" to="/parent/templates"><span aria-hidden="true">✦</span><span><strong>Mes listes</strong><small>Préparer les listes réutilisables</small></span><ArrowRight aria-hidden="true" /></Link>
      </div>
      {error && <p className="account-message account-message--error" role="alert">{error}</p>}
      {notice && <p className="account-message" role="status">{notice}</p>}
      <button className="account-signout" type="button" disabled={busy} onClick={() => void signOut()}><LogOut size={17} aria-hidden="true" /> Se déconnecter</button>
      <section className="account-danger" aria-labelledby="account-delete-title">
        <h2 id="account-delete-title">Supprimer mon compte</h2>
        <p>La suppression efface le foyer, les profils enfants, les modèles, les missions et la progression. Elle est définitive. Un appareil enfant resté hors ligne peut conserver une copie locale jusqu’à sa reconnexion ; son accès serveur sera alors révoqué.</p>
        {!deleteOpen ? (
          <button className="account-danger__button" type="button" disabled={busy} onClick={() => { setDeleteOpen(true); setDeleteConfirmation('') }}>
            <Trash2 size={17} aria-hidden="true" /> Supprimer le compte et le foyer
          </button>
        ) : (
          <div className="account-danger__form" role="alertdialog" aria-modal="false" aria-labelledby="account-delete-confirm-title">
            <label id="account-delete-confirm-title" htmlFor="account-delete-confirmation">Pour confirmer, saisissez SUPPRIMER.
              <input id="account-delete-confirmation" autoComplete="off" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} />
            </label>
            <div className="account-danger__actions">
              <button type="button" disabled={busy} onClick={() => { setDeleteOpen(false); setDeleteConfirmation('') }}>Annuler</button>
              <button className="account-danger__button" type="button" disabled={busy || deleteConfirmation.trim() !== 'SUPPRIMER'} onClick={() => void deleteAccount()}>
                {busy ? 'Suppression…' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        )}
      </section>
    </section></div>
  )

  return (
    <div className="account-page"><section className="account-card" aria-labelledby="account-title">
      <Link className="account-back" to="/">← Accueil</Link>
      <p className="account-eyebrow">COMPTE PARENT</p>
      <h1 id="account-title">{mode === 'sign-up' ? 'Créer mon compte' : mode === 'reset' ? 'Retrouver mon accès' : mode === 'new-password' ? 'Choisir un nouveau mot de passe' : 'Me connecter'}</h1>
      <p className="account-muted">Votre enfant rejoindra votre famille avec un QR code. Il n’aura jamais besoin d’adresse e-mail.</p>
      {mode !== 'new-password' && <label className="account-policy-ack"><input type="checkbox" checked={privacyNoticeRead} onChange={(event) => { setPrivacyNoticeRead(event.target.checked); setError('') }} /><span>J’ai lu la <Link to="/privacy">notice de confidentialité</Link> de PackQuest.</span></label>}
      {mode !== 'reset' && mode !== 'new-password' && <button className="account-google" type="button" disabled={busy} onClick={() => void signInWithGoogle()}><span className="account-google__mark">G</span> Continuer avec Google</button>}
      {mode !== 'reset' && mode !== 'new-password' && <div className="account-divider"><span>ou avec mon e-mail</span></div>}
      <form className="account-form" onSubmit={(event) => void submit(event)}>
        {mode !== 'new-password' && <label>Adresse e-mail<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>}
        {mode !== 'reset' && <label>{mode === 'new-password' ? 'Nouveau mot de passe' : 'Mot de passe'}<input type="password" minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>}
        {mode === 'sign-up' && <p className="account-privacy"><ShieldCheck size={18} aria-hidden="true" /> Le compte parent permet de gérer les profils, missions et appareils de votre foyer. Aucun profil d’enfant ne sera créé avant votre attestation de parent ou représentant légal.</p>}
        {error && <p className="account-message account-message--error" role="alert">{error}</p>}
        {notice && <p className="account-message" role="status">{notice}</p>}
        <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Veuillez patienter…' : mode === 'sign-up' ? 'Créer mon compte' : mode === 'reset' ? 'Envoyer le lien' : mode === 'new-password' ? 'Enregistrer le mot de passe' : 'Me connecter'}</button>
      </form>
      {mode === 'sign-in' ? <div className="account-links"><button type="button" onClick={() => changeMode('sign-up')}>Créer un compte parent</button><button type="button" onClick={() => changeMode('reset')}>Mot de passe oublié ?</button></div> : <button className="account-mode-link" type="button" onClick={() => changeMode('sign-in')}>J’ai déjà un compte</button>}
    </section></div>
  )
}
