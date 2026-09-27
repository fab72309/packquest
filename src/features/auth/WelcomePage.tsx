import { ArrowRight, QrCode, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router'
import './WelcomePage.css'

export function WelcomePage() {
  const previewBuild = import.meta.env.VITE_DEMO_MODE === 'true'
  const demoAvailable = import.meta.env.DEV || previewBuild

  return (
    <main className="welcome-page">
      <div className="welcome-panel">
        <div className="welcome-brand"><span className="welcome-brand__mark">✦</span> PackQuest</div>
        <p className="welcome-kicker">PRÉPARER SON SAC, ENSEMBLE</p>
        <h1>Chacun son espace.<br /><span>Une mission partagée.</span></h1>
        <p className="welcome-intro">Le parent prépare la liste. L’enfant retrouve sa mission et avance à son rythme.</p>
        <div className="welcome-choices">
          {previewBuild ? (
            <Link className="welcome-choice welcome-choice--demo" to="/parent">
              <span className="welcome-choice__icon"><Sparkles aria-hidden="true" /></span>
              <span><strong>Explorer la version de test</strong><small>Essayer les parcours parent et enfant avec des exemples fictifs</small></span>
              <ArrowRight aria-hidden="true" />
            </Link>
          ) : <>
            <Link className="welcome-choice" to="/parent/account">
              <span className="welcome-choice__icon"><UsersRound aria-hidden="true" /></span>
              <span><strong>Je suis parent</strong><small>Créer mon compte ou me connecter</small></span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link className="welcome-choice welcome-choice--child" to="/child/join">
              <span className="welcome-choice__icon"><QrCode aria-hidden="true" /></span>
              <span><strong>Je rejoins ma famille</strong><small>Scanner le QR code montré par mon parent</small></span>
              <ArrowRight aria-hidden="true" />
            </Link>
            {demoAvailable && <Link className="welcome-choice welcome-choice--demo" to="/parent">
              <span className="welcome-choice__icon"><Sparkles aria-hidden="true" /></span>
              <span><strong>Explorer la démo</strong><small>Parcours fictif, sans compte</small></span>
              <ArrowRight aria-hidden="true" />
            </Link>}
          </>}
        </div>
        {previewBuild ? <>
          <p className="welcome-preview-note"><ShieldCheck size={18} aria-hidden="true" /> Cette version n’ouvre pas de compte et n’envoie aucune donnée à PackQuest. Les exemples restent dans l’onglet et disparaissent au rechargement.</p>
          <Link className="welcome-privacy-link" to="/privacy">Confidentialité de cette version de test</Link>
        </> : <p className="welcome-privacy"><ShieldCheck size={18} aria-hidden="true" /> Vos données personnelles servent au fonctionnement de PackQuest. Nous ne les exploitons pas à des fins commerciales : ni vente, ni publicité ciblée.</p>}
      </div>
    </main>
  )
}
