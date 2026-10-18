import { ArrowLeft, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import './PrivacyNoticePage.css'

const contact = 'fab72309@gmail.com'
const deletionEmail = `mailto:${contact}?subject=Suppression%20du%20compte%20PackQuest`

export function AccountDeletionPage() {
  return (
    <main className="privacy-page">
      <Link className="privacy-back" to="/"><ArrowLeft size={16} aria-hidden="true" /> Retour à PackQuest</Link>
      <article className="privacy-card">
        <p className="privacy-eyebrow"><Trash2 size={16} aria-hidden="true" /> SUPPRESSION DE COMPTE</p>
        <h1>Supprimer un compte PackQuest</h1>
        <p className="privacy-lead">Vous pouvez supprimer un compte parent et les données de son foyer depuis l’application, ou en faire la demande par e-mail même si l’application n’est plus installée.</p>
        <section>
          <h2>Depuis PackQuest</h2>
          <p>Connectez-vous à votre espace parent, puis choisissez « Supprimer mon compte ». La confirmation supprime le compte parent, les profils enfants, modèles, missions, historiques, appareils et données associées du stockage actif.</p>
        </section>
        <section>
          <h2>Sans accès à l’application</h2>
          <p>Écrivez depuis l’adresse e-mail associée au compte à <a href={deletionEmail}>{contact}</a> avec l’objet « Suppression du compte PackQuest ». Indiquez uniquement que vous demandez la suppression du compte PackQuest. N’envoyez jamais votre mot de passe, un QR code ou un jeton d’appareil.</p>
          <p>Nous pouvons demander une confirmation depuis l’adresse du compte avant d’exécuter la demande. Le compte et les données associées seront supprimés du stockage actif ; si une conservation limitée est nécessaire pour une obligation légale ou la sécurité, nous vous en expliquerons le motif.</p>
        </section>
        <section>
          <h2>Copies hors ligne</h2>
          <p>Un appareil enfant resté hors ligne peut conserver une copie locale de missions et de changements en attente. Sur cet appareil, choisissez « Retirer cette famille de cet appareil » ou effacez les données locales de PackQuest. Une demande de suppression du compte invalide l’accès au serveur dès la prochaine connexion, mais ne peut pas effacer à distance un appareil hors ligne.</p>
        </section>
        <p className="privacy-footer">Notice de confidentialité : <Link to="/privacy">lire la notice PackQuest</Link>.</p>
      </article>
    </main>
  )
}
