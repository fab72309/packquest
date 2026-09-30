import { useEffect, useState, type FormEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ArrowRight, History, LogOut, QrCode, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router'
import { getAppUrl } from '../../lib/appUrl'
import { isSupabaseConfigured, supabase } from '../../lib/supabase/client'
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

  useEffect(() => {
    if (!supabase) return
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      if (!active) return
      setSession(next)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setMode('new-password')
    })
    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
      if (sessionError) setError('La session ne peut pas être vérifiée. Réessayez.')
    }).catch(() => { if (active) { setLoading(false); setError('La session ne peut pas être vérifiée. Réessayez.') } })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  function changeMode(next: AuthMode) { setMode(next); setError(''); setNotice(''); setPassword('') }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true); setError(''); setNotice('')
    try {
      if (mode === 'sign-up') {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: getAppUrl('/parent/account') } })
        if (authError) throw authError
        setNotice(data.session ? 'Votre compte parent est créé.' : 'Vérifiez votre boîte mail pour confirmer votre adresse.')
      } else if (mode === 'reset') {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: getAppUrl('/parent/account') })
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
    setBusy(true); setError(''); setNotice('')
    const { error: authError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: getAppUrl('/parent/account') } })
    if (authError) { setError('La connexion Google est indisponible pour le moment.'); setBusy(false) }
  }

  async function signOut() {
    if (!supabase) return
    setBusy(true); setError('')
    const { error: authError } = await supabase.auth.signOut()
    if (authError) setError('La déconnexion a échoué. Réessayez.')
    setBusy(false)
  }

  if (loading) return <div className="account-page"><div className="account-card" role="status">Vérification du compte…</div></div>

  if (!isSupabaseConfigured || !supabase) return <div className="account-page"><section className="account-card"><h1>Compte parent indisponible</h1><p>La connexion sécurisée n’est pas configurée sur cette version.</p><Link className="button button--secondary" to="/">Retour à l’accueil</Link></section></div>

  if (session && mode !== 'new-password') return (
    <div className="account-page"><section className="account-card account-card--wide">
      <p className="account-eyebrow">ESPACE PARENT</p><h1>Bienvenue dans votre famille PackQuest.</h1>
      <p className="account-muted">Connecté avec {session.user.email || 'Google'}. L’enfant n’a pas besoin de compte : vous lui montrez un QR code depuis votre espace.</p>
      <div className="account-actions">
        <Link className="account-action" to="/parent/create"><Sparkles aria-hidden="true" /><span><strong>Préparer une mission</strong><small>Choisir un modèle et l’envoyer à mon enfant</small></span><ArrowRight aria-hidden="true" /></Link>
        <Link className="account-action" to="/parent/pairing"><QrCode aria-hidden="true" /><span><strong>Relier l’appareil de mon enfant</strong><small>Créer son profil et afficher un QR code temporaire</small></span><ArrowRight aria-hidden="true" /></Link>
        <Link className="account-action" to="/parent/history"><History aria-hidden="true" /><span><strong>Voir les missions</strong><small>Retrouver les préparations et leur historique</small></span><ArrowRight aria-hidden="true" /></Link>
        <Link className="account-action" to="/parent/templates"><span aria-hidden="true">✦</span><span><strong>Mes modèles</strong><small>Préparer les listes réutilisables</small></span><ArrowRight aria-hidden="true" /></Link>
      </div>
      {error && <p className="account-message account-message--error" role="alert">{error}</p>}
      <button className="account-signout" type="button" disabled={busy} onClick={() => void signOut()}><LogOut size={17} aria-hidden="true" /> Se déconnecter</button>
    </section></div>
  )

  return (
    <div className="account-page"><section className="account-card" aria-labelledby="account-title">
      <Link className="account-back" to="/">← Accueil</Link>
      <p className="account-eyebrow">COMPTE PARENT</p>
      <h1 id="account-title">{mode === 'sign-up' ? 'Créer mon compte' : mode === 'reset' ? 'Retrouver mon accès' : mode === 'new-password' ? 'Choisir un nouveau mot de passe' : 'Me connecter'}</h1>
      <p className="account-muted">Votre enfant rejoindra votre famille avec un QR code. Il n’aura jamais besoin d’adresse e-mail.</p>
      {mode !== 'reset' && mode !== 'new-password' && <button className="account-google" type="button" disabled={busy} onClick={() => void signInWithGoogle()}><span className="account-google__mark">G</span> Continuer avec Google</button>}
      {mode !== 'reset' && mode !== 'new-password' && <div className="account-divider"><span>ou avec mon e-mail</span></div>}
      <form className="account-form" onSubmit={(event) => void submit(event)}>
        {mode !== 'new-password' && <label>Adresse e-mail<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>}
        {mode !== 'reset' && <label>{mode === 'new-password' ? 'Nouveau mot de passe' : 'Mot de passe'}<input type="password" minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>}
        {mode === 'sign-up' && <p className="account-privacy"><ShieldCheck size={18} aria-hidden="true" /> Vos données personnelles servent au fonctionnement de PackQuest. Nous ne les exploitons pas à des fins commerciales : ni vente, ni publicité ciblée.</p>}
        {error && <p className="account-message account-message--error" role="alert">{error}</p>}
        {notice && <p className="account-message" role="status">{notice}</p>}
        <button className="button button--primary" type="submit" disabled={busy}>{busy ? 'Veuillez patienter…' : mode === 'sign-up' ? 'Créer mon compte' : mode === 'reset' ? 'Envoyer le lien' : mode === 'new-password' ? 'Enregistrer le mot de passe' : 'Me connecter'}</button>
      </form>
      {mode === 'sign-in' ? <div className="account-links"><button type="button" onClick={() => changeMode('sign-up')}>Créer un compte parent</button><button type="button" onClick={() => changeMode('reset')}>Mot de passe oublié ?</button></div> : <button className="account-mode-link" type="button" onClick={() => changeMode('sign-in')}>J’ai déjà un compte</button>}
    </section></div>
  )
}
