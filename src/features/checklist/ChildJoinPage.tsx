import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, Camera, Keyboard, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router'
import { getAppPath } from '../../lib/appUrl'
import { ChildOfflineError, pairChild } from '../../services/childOffline'
import './ChildJoinPage.css'

function extractPairingToken(value: string): string | null {
  const trimmed = value.trim()
  if (/^[A-Za-z0-9_-]{32,160}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.origin !== window.location.origin || url.pathname !== getAppPath('/child/join')) return null
    const token = new URLSearchParams(url.hash.slice(1)).get('token')
    return token && /^[A-Za-z0-9_-]{32,160}$/.test(token) ? token : null
  } catch { return null }
}

export function ChildJoinPage() {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const stopScannerRef = useRef<(() => void) | null>(null)
  const scanningRef = useRef(false)
  const pairingRef = useRef(false)
  const [manualValue, setManualValue] = useState('')
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [alreadyPaired, setAlreadyPaired] = useState(false)

  useEffect(() => {
    const token = extractPairingToken(window.location.href)
    if (!token) return
    window.history.replaceState(null, '', getAppPath('/child/join'))
    void connect(token)
    // The URL fragment is a one-use credential and must be removed immediately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => () => { scanningRef.current = false; stopScannerRef.current?.() }, [])

  async function connect(token: string) {
    if (pairingRef.current) return
    pairingRef.current = true
    scanningRef.current = false
    stopScannerRef.current?.()
    setScanning(false)
    setBusy(true)
    setError('')
    setAlreadyPaired(false)
    try {
      await pairChild(token)
      navigate('/child', { replace: true })
    } catch (pairError) {
      if (pairError instanceof ChildOfflineError && pairError.kind === 'invalid_action') setAlreadyPaired(true)
      setError(pairError instanceof ChildOfflineError && ['invalid_action', 'network', 'not_configured', 'storage'].includes(pairError.kind)
        ? pairError.message
        : 'Ce QR code est expiré ou déjà utilisé. Demande à ton parent d’en créer un nouveau.')
    } finally { pairingRef.current = false; setBusy(false) }
  }

  async function startScanner() {
    if (!videoRef.current) return
    setError('')
    scanningRef.current = true
    setScanning(true)
    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser')
      const reader = new BrowserQRCodeReader()
      const controls = await reader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
        if (!scanningRef.current) return
        if (!result) return
        const token = extractPairingToken(result.getText())
        if (token) void connect(token)
        else setError('Ce QR code ne vient pas de PackQuest.')
      })
      if (scanningRef.current) stopScannerRef.current = () => controls.stop()
      else controls.stop()
    } catch {
      scanningRef.current = false
      setScanning(false)
      setError('La caméra est indisponible. Tu peux aussi coller le lien donné par ton parent.')
    }
  }

  function stopScanner() { scanningRef.current = false; stopScannerRef.current?.(); stopScannerRef.current = null; setScanning(false) }

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = extractPairingToken(manualValue)
    if (!token) { setError('Ce lien ne ressemble pas à une invitation PackQuest.'); return }
    void connect(token)
  }

  return (
    <main className="join-page">
      <section className="join-card">
        <Link className="join-back" to="/">← Accueil</Link>
        <div className="join-hero-icon"><Camera size={31} aria-hidden="true" /></div>
        <p className="join-eyebrow">ESPACE ENFANT</p>
        <h1>Rejoins ta famille</h1>
        <p className="join-intro">Demande à ton parent d’afficher le QR code sur son téléphone. Scanne-le ici pour retrouver tes missions.</p>
        <div className="join-video-wrap"><video ref={videoRef} className={scanning ? 'join-video is-active' : 'join-video'} autoPlay playsInline muted /><span className="join-video-placeholder">{scanning ? 'Place le QR code dans le cadre' : 'La caméra démarre quand tu appuies sur le bouton'}</span></div>
        {!scanning ? <button className="button join-primary" type="button" disabled={busy} onClick={() => void startScanner()}><Camera size={19} aria-hidden="true" /> Scanner le QR code</button> : <button className="button join-secondary" type="button" onClick={stopScanner}>Arrêter la caméra</button>}
        <div className="join-manual"><p><Keyboard size={17} aria-hidden="true" /> Tu as reçu un lien ?</p><form onSubmit={submitManual}><label className="sr-only" htmlFor="pair-link">Lien d’invitation PackQuest</label><input id="pair-link" value={manualValue} onChange={(event) => setManualValue(event.target.value)} placeholder="Colle le lien ici" autoComplete="off" /><button type="submit" aria-label="Rejoindre avec ce lien" disabled={busy}><ArrowRight size={19} aria-hidden="true" /></button></form></div>
        {busy && <p className="join-status" role="status">Connexion à ta famille…</p>}
        {error && <p className="join-error" role="alert">{error}</p>}
        {alreadyPaired && <Link className="join-existing" to="/child">Ouvrir mon espace</Link>}
        <p className="join-reassurance"><ShieldCheck size={17} aria-hidden="true" /> Tu n’as besoin ni d’e-mail ni de mot de passe.</p>
      </section>
    </main>
  )
}
