import { ArrowLeft, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import './PrivacyNoticePage.css'

export function PrivacyNoticePage() {
  return (
    <main className="privacy-page">
      <Link className="privacy-back" to="/"><ArrowLeft size={16} aria-hidden="true" /> Retour à PackQuest</Link>
      <article className="privacy-card">
        <p className="privacy-eyebrow"><ShieldCheck size={16} aria-hidden="true" /> VERSION DE TEST</p>
        <h1>Confidentialité de la démo</h1>
        <p className="privacy-lead">Cette version permet d’explorer PackQuest avec des exemples fictifs. Elle ne permet pas de créer un compte ni de préparer une mission familiale réelle.</p>

        <section>
          <h2>Ce que fait PackQuest dans cette démo</h2>
          <ul>
            <li>Les noms, modèles et missions affichés sont des exemples intégrés à l’application.</li>
            <li>Les changements restent en mémoire dans l’onglet ouvert et sont effacés au rechargement.</li>
            <li>Cette version n’est reliée ni à Supabase ni à un service d’authentification.</li>
            <li>Aucun outil de publicité ou de mesure d’audience n’est activé dans PackQuest.</li>
          </ul>
        </section>

        <section>
          <h2>Hébergement de la page</h2>
          <p>La démo est hébergée par GitHub Pages. GitHub indique enregistrer l’adresse IP des visiteurs à des fins de sécurité. Pour les informations sur ce traitement, consultez la <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" target="_blank" rel="noreferrer">déclaration de confidentialité de GitHub <ExternalLink size={14} aria-hidden="true" /></a>.</p>
        </section>

        <p className="privacy-footer">N’utilisez pas cette démo avec le nom, les coordonnées ou les affaires réelles d’un enfant. La notice du service connecté sera publiée avant l’ouverture des comptes de test.</p>
      </article>
    </main>
  )
}
