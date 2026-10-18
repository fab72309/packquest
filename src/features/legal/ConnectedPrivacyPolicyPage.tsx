import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router'
import { getAppUrl } from '../../lib/appUrl'
import './PrivacyNoticePage.css'

const contact = 'fab72309@gmail.com'

export function ConnectedPrivacyPolicyPage() {
  return (
    <main className="privacy-page">
      <Link className="privacy-back" to="/"><ArrowLeft size={16} aria-hidden="true" /> Retour à PackQuest</Link>
      <article className="privacy-card">
        <p className="privacy-eyebrow"><ShieldCheck size={16} aria-hidden="true" /> NOTICE DU SERVICE CONNECTÉ</p>
        <h1>Confidentialité de PackQuest</h1>
        <p className="privacy-lead">Dernière mise à jour : 30 septembre 2026. PackQuest aide un parent et son enfant à préparer une liste d’affaires. Les profils enfants sont créés et gérés par un parent ou représentant légal.</p>

        <section>
          <h2>Responsable et contact</h2>
          <p>Responsable de la publication et du traitement pour PackQuest : Fabien. Pour toute question sur cette notice, exercer un droit ou demander la suppression de données, écrivez à <a href={`mailto:${contact}`}>{contact}</a>.</p>
        </section>
        <section>
          <h2>Données traitées</h2>
          <ul>
            <li>Compte parent : adresse e-mail, identifiant de compte et, si la connexion Google est choisie, les informations de profil transmises par Google.</li>
            <li>Profil enfant : prénom d’usage ou pseudonyme et avatar choisis par le parent.</li>
            <li>Vie familiale dans l’application : noms de modèles et de missions, affaires, états de checklist, historique et, si le parent l’active, courts messages d’aide associés à une affaire.</li>
            <li>Signalements de sécurité : copie du message signalé, motif, identifiants du profil, de la mission et de l’affaire, rôle du déclarant, état du signalement et dates de traitement.</li>
            <li>Sécurité et synchronisation : hachages de jetons d’appairage et d’appareil, dates de création/révocation et dernière connexion, ainsi que reçus techniques nécessaires à la synchronisation idempotente.</li>
            <li>Journaux techniques du service connecté : l’infrastructure Supabase peut journaliser l’adresse IP des requêtes et en déduire une zone approximative (pays, région, ville ou code postal), ainsi que l’agent utilisateur, la route, la méthode et des horodatages nécessaires au fonctionnement, au diagnostic et à la sécurité.</li>
            <li>Sur l’appareil : session parent, copie locale des missions de l’enfant et changements en attente hors ligne. Ces éléments sont stockés dans le navigateur ou l’application.</li>
          </ul>
          <p>La date de naissance n’est pas enregistrée ni envoyée : elle est utilisée uniquement sur l’appareil pour orienter vers l’espace adulte ou enfant. Le résultat adulte est conservé temporairement dans la session de l’application et supprimé quand le parent se déconnecte. La caméra s’active uniquement après l’action « Scanner le QR code » ; l’image sert à reconnaître le code sur l’appareil et n’est pas enregistrée ni envoyée par PackQuest.</p>
        </section>
        <section>
          <h2>Utilisation, destinataires et sécurité</h2>
          <p>Les données servent à créer le compte parent, relier les appareils, préparer et synchroniser les missions, afficher la progression, répondre à une demande d’aide autorisée et protéger l’accès au foyer. Les données ne sont ni vendues ni utilisées pour de la publicité ciblée. PackQuest n’intègre pas de SDK publicitaire ni d’outil de mesure d’audience.</p>
          <p>Le fournisseur d’infrastructure Supabase héberge l’authentification, la base de données, les fonctions serveur et les journaux techniques. La base PackQuest est configurée dans la région de Paris (eu-west-3). L’application Android ne demande pas l’autorisation de localisation et n’accède pas au GPS : la zone indiquée dans certains journaux est estimée par l’infrastructure à partir de l’adresse IP transmise avec la requête. Google traite les informations de connexion lorsque le parent choisit la connexion Google. Les traitements des fournisseurs suivent aussi leurs propres conditions : <a href="https://supabase.com/privacy" target="_blank" rel="noreferrer">notice de Supabase</a> et <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">notice de Google</a>.</p>
          <p>Les demandes d’aide sont désactivées par défaut et ne peuvent être activées que par un adulte depuis le compte parent. Un rappel de sécurité est affiché à l’enfant avant l’envoi d’un message.</p>
          <p>Un signalement de message est transmis au serveur PackQuest pour examen par l’équipe responsable. Le contenu du message et le motif sont conservés comme preuve jusqu’à la clôture du signalement. Un signalement suspend immédiatement les échanges concernés ; l’enfant peut aussi bloquer les messages. L’équipe examine le signalement avant de lever ce blocage. Un signalement n’envoie pas automatiquement de courriel. <a href={getAppUrl('/ugc-guidelines.html')}>Lire les règles des échanges</a>.</p>
        </section>
        <section>
          <h2>Durée, droits et suppression</h2>
          <p>Les données actives du foyer restent associées au compte parent jusqu’à la suppression de celui-ci. Le parent peut retirer un appareil à tout moment. La suppression du compte depuis l’application ou la <Link to="/account-deletion">page de suppression</Link> efface le compte et les données du foyer dans la base active. Une copie déjà présente sur un appareil hors ligne peut y rester jusqu’à ce que l’enfant choisisse « Retirer cette famille de cet appareil » ou que les données locales de l’application soient effacées.</p>
          <p>Les copies de messages incluses dans un signalement sont conservées jusqu’à la clôture de l’examen ; elles sont supprimées avec les autres données du foyer lors de la suppression du compte.</p>
          <p>Le projet Supabase utilise actuellement le plan gratuit : les journaux API et base de données y sont conservés un jour et ce plan ne comprend pas de sauvegarde quotidienne automatique. Une demande d’accès, de rectification, d’opposition ou d’effacement peut être adressée à <a href={`mailto:${contact}`}>{contact}</a>.</p>
        </section>
        <section>
          <h2>Enfants et autorisation parentale</h2>
          <p>PackQuest est conçu pour les enfants de 6 à 17 ans et les adultes de leur famille. Le parent ou représentant légal confirme son rôle et l’autorisation de créer un profil enfant avant d’y ajouter des données. N’ajoutez pas de nom complet, d’adresse, d’école, de téléphone, de localisation ou de photo dans un profil ou un message.</p>
          <p>Les règles applicables aux données d’enfants varient selon leur pays. Le responsable peut être contacté pour toute question ou demande. Les équipes de test doivent utiliser des données fictives.</p>
        </section>
        <p className="privacy-footer">Pour demander la suppression de votre compte et des données associées, utilisez la <Link to="/account-deletion">page de suppression PackQuest</Link>.</p>
      </article>
    </main>
  )
}
