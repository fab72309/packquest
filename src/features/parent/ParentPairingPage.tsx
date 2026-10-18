import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Copy, Plus, QrCode, ShieldCheck, Smartphone, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router'
import { getAppUrl } from '../../lib/appUrl'
import { supabase } from '../../lib/supabase/client'
import { parentAction } from '../../services/parentApi'
import { CHILD_HELP_POLICY_VERSION } from '../../services/childOfflineService'
import './ParentPairingPage.css'

type Child = {
  id: string
  name: string
  allow_help_requests: boolean
  help_interactions_paused_at: string | null
  help_interactions_paused_by: 'child' | 'parent' | null
  help_policy_version: string | null
}
type Device = { id: string; child_profile_id: string; created_at: string; revoked_at: string | null }
type Pairing = { token: string; expires_at: string; childId: string }

export function ParentPairingPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [name, setName] = useState('')
  const [guardianConsent, setGuardianConsent] = useState(false)
  const [pairing, setPairing] = useState<Pairing | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(supabase ? '' : 'La connexion au compte n’est pas configurée.')
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    if (!supabase) return
    const { data: { session } } = await supabase.auth.getSession()
    setError('')
    if (!session) { setError('Connectez-vous à votre compte parent pour relier un appareil.'); setLoading(false); return }
    const [childResult, deviceResult] = await Promise.all([
      supabase.from('child_profiles').select('id,name,allow_help_requests,help_interactions_paused_at,help_interactions_paused_by,help_policy_version').order('created_at'),
      supabase.from('child_devices').select('id,child_profile_id,created_at,revoked_at').order('created_at', { ascending: false }),
    ])
    if (childResult.error || deviceResult.error) { setError('Impossible de charger les profils et appareils. Réessayez.'); setLoading(false); return }
    const loadedChildren = childResult.data as Child[]
    setChildren(loadedChildren)
    setDevices(deviceResult.data as Device[])
    setSelectedChildId((current) => loadedChildren.some((child) => child.id === current) ? current : (loadedChildren[0]?.id ?? ''))
    setLoading(false)
  }, [])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!pairing) return
    const delay = Math.max(0, new Date(pairing.expires_at).getTime() - Date.now())
    const timer = window.setTimeout(() => {
      setPairing(null)
      setNotice('Le QR code a expiré. Créez-en un nouveau si l’appareil n’a pas encore été relié.')
    }, delay)
    return () => window.clearTimeout(timer)
  }, [pairing])

  async function createChild(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await parentAction<{ child: Child }>('create_child', {
        name: name.trim(),
        parental_consent: guardianConsent,
        policy_version: '2026-09-29',
      })
      setName('')
      setGuardianConsent(false)
      await load()
      setSelectedChildId(result.child.id)
      setNotice('Profil enfant créé. Vous pouvez maintenant afficher son QR code.')
    } catch { setError('Le profil n’a pas pu être créé. Vérifiez le prénom et réessayez.') }
    finally { setBusy(false) }
  }

  async function changeHelpPermission(enabled: boolean) {
    if (!selectedChild) return
    if (enabled && !window.confirm(`J’ai lu les règles des échanges PackQuest. Autoriser ${selectedChild.name} à envoyer de courts messages liés à une affaire ? Les échanges restent dans la famille. L’enfant peut signaler une réponse et suspendre les messages ; une suspension après signalement ne peut être levée qu’après examen par l’équipe PackQuest.`)) return
    setBusy(true); setError(''); setNotice('')
    try {
      const result = await parentAction<{ child: Child }>('set_child_help_permission', {
        child_id: selectedChild.id,
        enabled,
        policy_version: enabled ? CHILD_HELP_POLICY_VERSION : null,
      })
      setChildren((current) => current.map((child) => child.id === result.child.id ? result.child : child))
      setNotice(enabled ? 'Les demandes d’aide sont activées pour ce profil.' : 'Les demandes d’aide sont désactivées pour ce profil.')
    } catch {
      setError(selectedChild.help_interactions_paused_by === 'child' && enabled
        ? 'Les échanges restent suspendus après un signalement. Contactez l’équipe PackQuest pour qu’elle examine la situation.'
        : 'Cette autorisation n’a pas pu être modifiée. Réessayez.')
    } finally { setBusy(false) }
  }

  async function createPairing() {
    if (!selectedChildId) return
    setBusy(true); setError(''); setNotice(''); setPairing(null)
    try {
      const result = await parentAction<{ token: string; expires_at: string }>('create_pairing', { child_id: selectedChildId })
      setPairing({ ...result, childId: selectedChildId })
    } catch { setError('Le QR code n’a pas pu être créé. Réessayez.') }
    finally { setBusy(false) }
  }

  async function revokeDevice(deviceId: string) {
    if (!window.confirm('Retirer cet appareil ? Votre enfant devra scanner un nouveau QR code pour revenir sur cet appareil.')) return
    setBusy(true); setError(''); setNotice('')
    try {
      await parentAction('revoke_device', { device_id: deviceId })
      await load()
      setNotice('Appareil retiré.')
    } catch { setError('Cet appareil n’a pas pu être retiré. Réessayez.') }
    finally { setBusy(false) }
  }

  const selectedChild = children.find((child) => child.id === selectedChildId)
  const joinUrl = pairing ? `${getAppUrl('/child/join')}#token=${encodeURIComponent(pairing.token)}` : ''
  const selectedDevices = devices.filter((device) => device.child_profile_id === selectedChildId && !device.revoked_at)

  return (
    <div className="page pairing-page">
      <Link className="back-link" to="/parent/account"><ArrowLeft size={16} aria-hidden="true" /> Mon compte</Link>
      <div className="page-heading"><div><p className="eyebrow">APPAIRAGE ENFANT</p><h1>Relier son appareil</h1><p className="page-subtitle">Un QR code temporaire relie l’appareil au profil de votre enfant. Aucun e-mail n’est demandé à l’enfant.</p></div></div>
      {loading ? <div className="pairing-panel" role="status">Chargement des profils…</div> : <div className="pairing-grid">
        <section className="pairing-panel" aria-labelledby="pairing-child-title">
          <h2 id="pairing-child-title">1. Choisir un enfant</h2>
          {children.length > 0 ? <label className="pairing-label">Profil enfant<select value={selectedChildId} onChange={(event) => { setSelectedChildId(event.target.value); setPairing(null) }}>{children.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</select></label> : <p className="pairing-muted">Créez un profil avec son prénom d’usage. Aucune autre donnée personnelle n’est nécessaire.</p>}
          <form className="pairing-create" onSubmit={(event) => void createChild(event)}><label className="pairing-label">Nouveau profil<input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Prénom ou pseudonyme" required /></label><label className="pairing-consent"><input type="checkbox" checked={guardianConsent} onChange={(event) => setGuardianConsent(event.target.checked)} required /><span>Je suis le parent ou représentant légal de cet enfant, j’ai lu la <Link to="/privacy">notice de confidentialité</Link> et j’autorise la création de ce profil pour PackQuest.</span></label><button className="button button--secondary" type="submit" disabled={busy || !name.trim() || !guardianConsent}><Plus size={16} aria-hidden="true" /> Ajouter</button></form>
          {selectedChild && <div className="pairing-help-setting"><label><input type="checkbox" checked={selectedChild.allow_help_requests} disabled={busy || selectedChild.help_interactions_paused_by === 'child'} onChange={(event) => void changeHelpPermission(event.target.checked)} /><span><strong>Demandes d’aide de l’enfant</strong><small>Autoriser de courts messages à propos d’une affaire. Désactivé par défaut ; seul un adulte connecté peut activer cette option. <a href={getAppUrl('/ugc-guidelines.html')} target="_blank" rel="noreferrer">Lire les règles des échanges</a></small></span></label>{selectedChild.help_interactions_paused_at && <p className="pairing-help-paused" role="status">Les messages sont suspendus{selectedChild.help_interactions_paused_by === 'child' ? ' après un signalement ; une revue par l’équipe PackQuest est nécessaire' : ' par un adulte'}.</p>}</div>}
          <h2>2. Montrer le QR code</h2>
          <p className="pairing-muted">Sur l’appareil de l’enfant, ouvrez PackQuest puis « Je rejoins ma famille ».</p>
          <button className="button button--primary" type="button" disabled={busy || !selectedChildId} onClick={() => void createPairing()}><QrCode size={18} aria-hidden="true" /> Créer un QR code pour {selectedChild?.name ?? 'mon enfant'}</button>
          {pairing && <div className="pairing-qr" role="group" aria-label={`QR code temporaire pour ${selectedChild?.name ?? 'votre enfant'}`}><QRCodeSVG value={joinUrl} size={214} includeMargin level="M" /><p>À scanner avant {new Date(pairing.expires_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}. Usage unique.</p><button type="button" onClick={() => void navigator.clipboard.writeText(joinUrl).then(() => setNotice('Lien copié.')).catch(() => setError('Le lien n’a pas pu être copié.'))}><Copy size={16} aria-hidden="true" /> Copier le lien</button><button type="button" onClick={() => setPairing(null)}><X size={16} aria-hidden="true" /> Masquer</button></div>}
        </section>
        <section className="pairing-panel" aria-labelledby="pairing-devices-title"><div className="pairing-device-heading"><h2 id="pairing-devices-title"><Smartphone size={20} aria-hidden="true" /> Appareils reliés</h2><button type="button" onClick={() => void load()}>Actualiser</button></div>{selectedDevices.length ? <ul className="pairing-device-list">{selectedDevices.map((device) => <li key={device.id}><span><strong>Appareil de {selectedChild?.name}</strong><small>Relié le {new Date(device.created_at).toLocaleDateString('fr-FR')}</small></span><button type="button" disabled={busy} onClick={() => void revokeDevice(device.id)}>Retirer</button></li>)}</ul> : <p className="pairing-muted">Aucun appareil relié à ce profil pour le moment.</p>}<p className="pairing-security"><ShieldCheck size={18} aria-hidden="true" /> Vous pouvez retirer un appareil à tout moment. Il perd alors l’accès aux nouvelles données dès sa prochaine connexion.</p></section>
      </div>}
      {error && <p className="account-message account-message--error" role="alert">{error}</p>}
      {notice && <p className="account-message" role="status">{notice}</p>}
    </div>
  )
}
