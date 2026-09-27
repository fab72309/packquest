import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ArrowLeft, Copy, Plus, QrCode, ShieldCheck, Smartphone, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Link } from 'react-router'
import { getAppUrl } from '../../lib/appUrl'
import { supabase } from '../../lib/supabase/client'
import { parentAction } from '../../services/parentApi'
import './ParentPairingPage.css'

type Child = { id: string; name: string }
type Device = { id: string; child_profile_id: string; created_at: string; revoked_at: string | null }
type Pairing = { token: string; expires_at: string; childId: string }

export function ParentPairingPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [devices, setDevices] = useState<Device[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [name, setName] = useState('')
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
      supabase.from('child_profiles').select('id,name').order('created_at'),
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
      const result = await parentAction<{ child: Child }>('create_child', { name: name.trim() })
      setName('')
      await load()
      setSelectedChildId(result.child.id)
      setNotice('Profil enfant créé. Vous pouvez maintenant afficher son QR code.')
    } catch { setError('Le profil n’a pas pu être créé. Vérifiez le prénom et réessayez.') }
    finally { setBusy(false) }
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
          <form className="pairing-create" onSubmit={(event) => void createChild(event)}><label className="pairing-label">Nouveau profil<input value={name} onChange={(event) => setName(event.target.value)} maxLength={40} placeholder="Prénom ou pseudonyme" required /></label><button className="button button--secondary" type="submit" disabled={busy || !name.trim()}><Plus size={16} aria-hidden="true" /> Ajouter</button></form>
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
