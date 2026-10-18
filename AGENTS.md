# AGENTS.md — PackQuest

## 1. Portée et sources de décision

Ces consignes s’appliquent uniquement au projet PackQuest dans ce dépôt.

Ordre de décision :

1. dernière instruction explicite de l’utilisateur ;
2. PRD validé, lorsqu’il existe ;
3. ce fichier ;
4. conventions déjà établies dans le dépôt.

Les lois et documentations officielles font autorité pour les questions juridiques, de sécurité et d’API. Si aucun PRD distinct n’est disponible, les choix produit consignés ici servent de base provisoire. Ne présente pas un document absent comme ayant été consulté et ne comble pas les lacunes par des fonctions inventées. Signale une ambiguïté seulement si elle change sensiblement le résultat, le périmètre ou le risque.

Avant une modification, examine l’état du dépôt, les consignes applicables et les fichiers concernés. Préserve le travail préexistant et les comportements hors périmètre.

## 2. Mission et boucle produit

PackQuest aide une famille à préparer régulièrement un sac ou une valise pour l’internat, la garde alternée, un séjour ou un voyage. Le parent prépare et suit la mission ; l’enfant réalise une checklist simple, motivante et compréhensible sans aide technique.

Boucle principale :

```text
Le parent crée une mission
→ l’enfant la reçoit et commence
→ il range les affaires ou signale un problème
→ la mission est terminée
→ la progression est mise à jour
```

Question directrice : **cette décision aide-t-elle l’enfant à préparer ses affaires de façon plus autonome ?** Elle doit aussi réduire la charge mentale du parent, prévenir les oublis et rester simple à maintenir.

## 3. Principes produit

- **Simplicité d’abord :** choisir la plus petite solution qui répond au besoin ; éviter les abstractions, services et dépendances prématurés.
- **Autonomie de l’enfant :** actions principales visibles, libellés concrets, grands contrôles tactiles. L’enfant n’a pas à comprendre les comptes, permissions, bases de données ou mécanismes de synchronisation.
- **Aide parentale sans micromanagement :** faciliter la préparation, le suivi et l’aide ponctuelle sans créer une obligation de surveiller chaque geste.
- **Vie privée par défaut :** ne collecter que ce qui est utile au produit.
- **Incréments verticaux :** livrer des parcours cohérents et utilisables plutôt qu’une architecture étendue mais inachevée.

## 4. Modèles et répartition du travail

La famille de modèles prévue est GPT‑6, avec Sol et Luna lorsque ces options sont disponibles dans l’environnement courant.

- **GPT‑6 (modèle principal) :** cadrage, décisions, intégration et arbitrage final.
- **GPT‑6 Sol :** architecture, compromis complexes, sécurité et revue de changements transverses.
- **GPT‑6 Luna :** exploration ciblée, inventaire, documentation, tâches bornées et vérifications simples.

Choisir le modèle selon la difficulté réelle ; ne pas imposer un modèle ou un niveau de raisonnement indisponible. Une délégation éventuelle doit avoir un périmètre indépendant, un résultat vérifiable et une vraie valeur de délai ou de qualité. Le modèle principal garde la responsabilité de l’intégration et des conclusions.

## 5. Plateforme et technologies

Base technique prévue :

```text
Frontend : React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React
Backend : Supabase PostgreSQL, Auth, RLS, Realtime au besoin, Edge Functions
Hébergement : Netlify
Plateforme initiale : application web responsive et PWA
Évolution mobile possible : Capacitor pour iOS et Android
```

Construire une application unique avec des expériences et permissions adaptées aux rôles Parent et Enfant. Ne remplace pas cette base sans raison architecturale concrète ou décision de l’utilisateur. Adapte-la aux outils déjà présents si le dépôt évolue.

Conçois d’abord pour un téléphone étroit, puis vérifie tablette et ordinateur. Le parcours enfant vise surtout le smartphone ; le parent doit pouvoir utiliser smartphone, tablette et ordinateur.

## 6. Architecture et qualité du code

Organise le code par fonctionnalités, en suivant les conventions du dépôt. Structure de départ possible :

```text
src/
  app/
  components/
  features/
    auth/ family/ children/ pairing/ templates/ missions/
    checklist/ gamification/ notifications/ profile/
  hooks/ lib/ services/ types/
```

Une fonctionnalité peut regrouper ses composants, hooks, services, types et fonctions utilitaires. Évite les dossiers globaux fourre-tout et les composants géants. Garde les règles métier hors des composants de présentation et ne généralise pas avant qu’un besoin récurrent soit établi.

Utilise TypeScript strictement. Évite `any`, sauf nécessité justifiée. Réutilise les types Supabase générés lorsqu’ils existent au lieu de maintenir un schéma concurrent à la main. Les noms de domaine du code restent cohérents : `Family`, `Parent`, `ChildProfile`, `Template`, `Mission`, `MissionItem`, `PairingToken`, `Device`, `Achievement`, `XpEvent`, `Streak`.

La clarté, la prévisibilité et la maintenabilité priment sur les abstractions ingénieuses. Les commentaires expliquent pourquoi une règle existe, pas ce que la ligne de code dit déjà.

## 7. Familles, comptes et appairage enfant

La famille est la frontière principale des données :

```text
Family
 ├── memberships parentales
 ├── profils enfant
 ├── templates
 ├── missions
 └── progression
```

Les parents utilisent une authentification Supabase persistante (lien magique ou courriel/mot de passe au départ). Les enfants ne devraient pas avoir à gérer une adresse courriel, un mot de passe ou un numéro de téléphone.

Le parcours d’appairage privilégié est : profil enfant créé par un parent → code court ou QR → appareil lié au profil. Les jetons doivent expirer, être à usage unique, être stockés sous forme hachée et être validés côté serveur. Prévoir la révocation d’un appareil. La logique sensible d’appairage relève d’une Edge Function ou d’un mécanisme serveur équivalent.

## 8. Vie privée, sécurité et secrets

Ne collecte pas par défaut la date de naissance exacte, l’adresse, le nom de l’établissement, la localisation, les contacts, les données biométriques ou des photos non nécessaires. Un prénom d’usage ou pseudonyme, un avatar et un identifiant technique suffisent généralement.

Pas de publicité ciblée, d’annuaire public, de découverte entre enfants ou de classement public.

Applique l’autorisation côté serveur. Les routes protégées, boutons masqués ou contrôles désactivés dans le frontend ne constituent pas une sécurité. Toutes les tables métier protégées doivent avoir des politiques RLS explicites couvrant `SELECT`, `INSERT`, `UPDATE` et `DELETE` selon le rôle et la famille. Un parent n’accède qu’aux familles autorisées ; un enfant n’accède qu’aux données nécessaires à son profil.

Ne place jamais une clé `service_role`, un secret privé ou des identifiants administratifs dans le frontend. L’URL Supabase et sa clé publique sont les seules valeurs de configuration sensibles acceptables côté client. Toute opération privilégiée s’exécute côté serveur. Les journaux ne contiennent ni jetons d’appairage bruts, ni mots de passe, ni secrets, ni données personnelles inutiles.

## 9. Missions, items et historique

Les états de mission sont explicites :

```text
draft → sent → started → completed
                    ↘ cancelled (selon le parcours)
```

Le statut `cancelled` peut aussi être atteint avant le démarrage. Centralise et contrôle les transitions au lieu de les déduire de champs sans lien.

États d’item :

- `pending` : l’enfant ne l’a pas encore traité ;
- `packed` : l’affaire est dans le sac ;
- `not_found` : l’affaire existe mais l’enfant ne la trouve pas ;
- `missing` : l’affaire n’est pas disponible.

Ne réduis pas la checklist à une case cochée/non cochée. La règle déterminant les états terminaux acceptés pour terminer une mission doit être explicite et centralisée dans une fonction métier ou une opération serveur.

Une mission issue d’un template devient indépendante de celui-ci. Modifier un template ne modifie jamais silencieusement une mission déjà envoyée ni un historique. Une mission terminée conserve ce qui était demandé, l’état des affaires et la date de réalisation.

Les catégories et items ont un champ d’ordre stable (`position`). Le réordonnancement doit rester utilisable sur mobile.

## 10. Aide et supervision

PackQuest n’est pas une messagerie. L’enfant peut demander une aide courte associée à un item, et le parent peut répondre dans ce contexte, par exemple : « regarde dans le tiroir du haut ». Pas de salon, conversation de groupe, réseau social ni messagerie libre sans décision produit explicite.

Le parent doit voir la progression, les problèmes signalés et les demandes d’aide utiles. Supabase Realtime sert d’abord au suivi d’une mission active quand l’actualisation immédiate améliore réellement l’expérience ; les autres données utilisent des requêtes normales.

## 11. Gamification et progression

La gamification renforce l’autonomie, l’organisation, la constance et l’accomplissement. Elle ne doit créer ni honte, ni pression excessive, ni comportement compulsif, ni compétition publique entre enfants.

- Calcule les XP à partir d’événements explicites et traçables (`xp_events`), par exemple `ITEM_PACKED`, `CATEGORY_COMPLETED`, `MISSION_COMPLETED` et `MISSION_AUTONOMOUS`.
- Rends l’attribution idempotente : reconnexion, répétition d’une requête, synchronisation hors ligne ou actualisation ne doit pas doubler une récompense.
- Calcule les succès de façon déterministe dans la logique métier, jamais dans un composant UI. Le serveur reste autoritaire pour XP, niveaux, séries et autorisations.
- Les séries encouragent sans punir. Ne construis pas la progression autour de la peur de perdre ; une semaine manquée ne doit pas effacer tout sentiment de réussite.
- Les animations de validation sont courtes, non bloquantes, compatibles avec `prefers-reduced-motion` et raisonnables pour les performances mobiles.

## 12. Identité visuelle et inspirations d’œuvres

L’univers visuel peut s’inspirer de Dragon Ball / Dragon Ball Z et du shōnen d’action : énergie, entraînement, progression par l’effort, dépassement de soi, rivalités, amitié, humour, combats chorégraphiés ou transformations. Il n’est pas nécessaire d’écarter ces idées de genre par principe. Elles servent de références créatives générales et doivent recevoir une interprétation propre à PackQuest.

En revanche, n’intègre pas sans autorisation d’éléments reconnaissables propres à une œuvre ou à une franchise : personnages, noms distinctifs, costumes, silhouettes, emblèmes, logos, attaques nommées, objets, lieux, espèces, factions, scènes, dialogues, musiques, illustrations ou combinaisons caractéristiques d’éléments. Ne produis pas un personnage équivalent sous un autre nom, ni une copie légèrement recolorée. Chaque personnage, symbole, tenue, pouvoir, nom, décor et élément narratif destiné à l’application doit avoir une conception originale ou une licence vérifiée.

Pour chaque création, garde comme critères :

1. l’inspiration porte sur une idée, une émotion ou une convention de genre ;
2. la réalisation concrète — formes, couleurs, proportions, détails, nom, contexte et combinaison — est propre à PackQuest ;
3. l’élément ne peut pas être confondu avec un personnage, logo ou contenu identifiable de la franchise ;
4. si la ressemblance reste discutée, retravaille la proposition au lieu de supposer qu’un changement superficiel suffit.

Ces règles réduisent le risque sans garantir à elles seules l’absence de litige. Avant une exploitation commerciale, vérifier aussi les marques et les droits sur les ressources utilisées ; demander un avis spécialisé si une création demeure proche d’une œuvre identifiable. Sources de cadrage : [Code de la propriété intellectuelle, article L. 111‑1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042814694/) et [article L. 122‑4](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278911/), ainsi que le [guide de l’Office européen de la propriété intellectuelle sur les idées et leur expression](https://intellectual-property-helpdesk.ec.europa.eu/news-events/news/public-domain-2020-11-19_en). Vérifier les textes et leur portée au moment de toute décision juridique concrète.

Direction recherchée : **un univers original de shōnen énergique**, avec sa propre identité, plutôt qu’une reproduction ou un simple renommage d’un univers existant.

## 13. Design system, ergonomie et accessibilité

Centralise les couleurs et autres tokens dans des variables sémantiques, par exemple :

```text
--background, --surface, --surface-elevated
--text-primary, --text-secondary
--energy-primary, --energy-secondary
--success, --warning, --danger
```

Utilise le thème Tailwind ou des variables CSS ; évite les valeurs arbitraires dispersées. Des composants réutilisables peuvent inclure `MissionCard`, `MissionProgress`, `ChecklistItem`, `ChecklistCategory`, `EnergyGauge`, `XPBar`, `AchievementCard`, `ChildAvatar`, `HelpAlert`, `EmptyState`, `ErrorState`, `LoadingState` et `MissionCompleteModal`. Ne crée que ceux qui servent un besoin réel.

Prévois contraste suffisant, typographie lisible, grandes cibles tactiles, navigation clavier pertinente, focus visible et libellés accessibles pour les icônes. Ne transmets jamais un état par la couleur seule. Toute vue asynchrone traite explicitement chargement, erreur, absence de données et succès. Les erreurs enfant restent simples et rassurantes ; les détails techniques vont dans les journaux adaptés.

## 14. Hors ligne et synchronisation

Priorité hors ligne MVP : une mission déjà chargée reste consultable et l’enfant peut continuer sa checklist. Conserve localement les changements en attente et synchronise-les au retour du réseau ; IndexedDB est une option si nécessaire. Il n’est pas demandé de rendre toutes les fonctions hors ligne.

Les mutations doivent porter assez de métadonnées pour être réconciliées proprement, par exemple `updated_at` et un identifiant de mutation client. Ne choisis pas un « dernier changement gagne » sans examiner ses effets sur les actions importantes. Une reconnexion ne doit pas dupliquer XP ou succès, rouvrir une mission terminée ni perdre une action de checklist. L’interface optimiste peut mettre à jour immédiatement un changement réversible et doit indiquer sobrement une synchronisation à reprendre en cas d’échec.

## 15. Données, migrations et développement

Toute évolution de schéma passe par une migration versionnée dans le dépôt ; ne laisse pas une modification importante uniquement dans le tableau de bord Supabase. Des données de démonstration peuvent couvrir une famille, un parent, deux profils enfant, quelques templates et missions. N’utilise jamais de vraies données d’enfants dans les fixtures.

Avant d’ajouter une dépendance, vérifie si le besoin peut être couvert simplement par la pile existante. Évite les bibliothèques lourdes ou redondantes, les appels de base superflus, les grandes images et les abonnements Realtime inutiles. Charge paresseusement les écrans secondaires lorsque cela apporte un bénéfice réel.

## 16. Périmètre MVP et IA

Ne présume pas que le MVP inclut l’IA, le réseau social, les profils publics, le chat parent-enfant, l’intégration aux établissements, la géolocalisation, la vision par ordinateur, les paiements, les abonnements, l’analytique avancée ou une place de marché.

Aucun LLM n’est nécessaire à la boucle principale. Une fonction future de suggestion de checklist doit expliquer son utilité et laisser le parent valider les propositions avant leur emploi.

## 17. Ordre conseillé des incréments

Construire progressivement, en réévaluant les dépendances à chaque étape :

1. fondation frontend, navigation, design system et client Supabase ;
2. authentification parentale et routes protégées ;
3. famille et profils enfant ;
4. appairage et révocation d’appareil ;
5. templates et catégories ;
6. création et envoi de missions ;
7. checklist enfant et signalement d’items ;
8. suivi parent et réponse d’aide contextualisée ;
9. progression et célébration ;
10. installation PWA et fonctionnement hors ligne de la checklist.

Ne lance pas plusieurs tranches qui dépendent les unes des autres en parallèle. Termine une tranche utilisable avant d’étendre le périmètre.

## 18. Discipline de changement et vérification

Pour chaque demande : comprendre le parcours visé, examiner le code existant, repérer les données et permissions touchées, puis faire le changement cohérent le plus limité. Préserve les routes, l’authentification, les données et les comportements sans rapport avec la demande.

Adapte la vérification au changement et aux instructions de l’utilisateur. **N’ajoute pas et n’exécute pas de tests sans demande explicite.** Si des tests ou validations sont demandés, cible le risque concerné et rapporte exactement ce qui a été exécuté, avec son résultat. Ne présente pas une revue, un build, un upload, une fusion ou une réponse HTTP comme une autre preuve que celle effectivement obtenue.

Pour une fonctionnalité, examine notamment les états de chargement, erreur et absence de contenu ; l’ergonomie mobile ; les règles métier centralisées ; les permissions serveur ; les politiques RLS et migrations si elles sont concernées ; et les parcours critiques touchés. Signale clairement les points qui n’ont pas été vérifiés. Ne déploie, ne publie et ne modifie aucun service distant sans autorisation explicite.

## 19. Parcours critiques

Toute évolution majeure doit préserver ces parcours ou expliquer précisément son effet :

**Parent :** inscription → création de famille → création d’un profil enfant → template → mission → envoi.

**Enfant :** ouverture de PackQuest → appairage → affichage de mission → démarrage → checklist → signalement d’un problème au besoin → fin.

**Suivi parent :** ouverture de mission → consultation de l’avancement → identification d’un problème → aide contextualisée → constat de fin.

## 20. Règle d’arbitrage et objectif

Quand plusieurs solutions conviennent, privilégie dans cet ordre : moins de friction pour l’enfant, moins de charge mentale pour le parent, moins de données personnelles, sécurité plus simple, moins de code et compatibilité avec la PWA et un futur emballage Capacitor.

L’objectif est de construire le plus petit produit robuste qui aide réellement l’enfant à préparer ses affaires de façon autonome.
