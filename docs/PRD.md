# PRD — PackQuest

**Version :** 1.1 — révision de cohérence\
**Statut :** document de travail pour le MVP\
**Date :** 26 septembre 2026\
**Plateforme cible :** application web responsive / PWA, puis Capacitor pour iOS et Android\
**Stack cible :** React, TypeScript, Vite, Tailwind CSS, React Router, Lucide React, Supabase, Netlify

Cette version clarifie le périmètre et les décisions déjà présentes dans le PRD fourni. Elle s’aligne sur [`AGENTS.md`](../AGENTS.md). Les choix notés « à confirmer » ne doivent pas être transformés silencieusement en règles de production.

## 1. Résumé et vision

PackQuest aide les familles à préparer régulièrement un sac ou une valise pour l’internat, la garde alternée, un séjour ou un voyage. Le parent prépare une mission depuis un modèle, l’envoie à l’enfant et suit les affaires qui sont prêtes ou qui nécessitent de l’aide. L’enfant suit une checklist guidée, signale un problème et visualise son avancement.

La valeur attendue est de réduire les oublis et la charge mentale du parent tout en développant l’autonomie de l’enfant. La technologie et les règles de synchronisation restent invisibles dans son parcours.

Boucle principale :

```text
Le parent prépare et envoie une mission
→ l’enfant consulte et traite chaque affaire
→ il demande de l’aide si nécessaire
→ le parent voit l’avancement et les problèmes
→ la préparation est clôturée et l’historique est conservé
```

## 2. Utilisateurs et besoins

### Parent

Le parent dispose d’un compte authentifié par e-mail ou Google. Il peut créer un foyer et un profil enfant, préparer et réutiliser des modèles, créer et envoyer des missions, suivre leur avancement, répondre à une demande d’aide, consulter l’historique et révoquer un appareil associé.

Le MVP cible d’abord un parent gestionnaire par foyer. Le modèle doit pouvoir évoluer vers plusieurs parents, mais l’invitation et la gestion de plusieurs comptes parentaux sont hors du premier incrément.

### Enfant

L’enfant utilise un appareil associé à son profil par le QR code montré par son parent. Il ne se connecte jamais avec une adresse e-mail, un mot de passe ou un numéro de téléphone : l’accueil propose directement « Je rejoins ma famille ». Il doit voir rapidement sa mission, agir affaire par affaire, demander une aide contextualisée et comprendre où il en est.

L’âge précis et le niveau de lecture visés restent à confirmer. En attendant, les textes doivent être courts, concrets, positifs et accompagnés de contrôles tactiles faciles à distinguer.

## 3. Principes d’expérience

- L’enfant comprend son action sans connaître les comptes, permissions, bases de données ou erreurs techniques.
- Le parent peut préparer puis suivre la mission sans devoir surveiller chaque validation.
- La checklist distingue une affaire rangée d’une affaire introuvable ou indisponible.
- Toute demande d’aide reste attachée à une affaire ; PackQuest n’est pas une messagerie générale.
- La progression encourage sans honte, pression excessive, classement public ou compétition entre enfants.
- La collecte de données reste minimale et les données de chaque foyer sont isolées côté serveur.
- Les données personnelles ne sont pas exploitées à des fins commerciales : ni vente, ni publicité ciblée. L’information donnée à l’inscription doit rester cohérente avec la notice complète de confidentialité et les contrats des fournisseurs.
- L’application est unique, avec des expériences et des permissions distinctes selon le rôle.

## 4. Périmètre et étapes de livraison

Le PRD décrit le **MVP produit connecté**. La première livraison demandée est une **V0 frontend cliquable**, volontairement limitée, qui permet d’examiner les parcours et l’interface avant de brancher l’authentification et les données réelles. La V0 n’est pas le MVP complet et ne doit pas être présentée comme une application sécurisée ou multi-appareil.

### 4.1 V0 frontend cliquable

- Une seule application responsive avec un contrôle clairement identifié comme aperçu de démonstration pour passer entre les expériences Parent et Enfant.
- Un tableau de bord parent pour une mission de démonstration et ses problèmes.
- Une préparation simple de mission depuis un modèle fourni : choix du modèle, titre/période et confirmation. La V0 ne modifie pas les items, quantités ou commentaires du modèle.
- Un parcours enfant avec mission disponible, démarrage, checklist par catégories et états `packed`, `not_found` et `missing`.
- Des données synthétiques partagées en mémoire entre les vues parent et enfant ; un rafraîchissement peut les réinitialiser.
- Une réponse d’aide contextualisée simulée et visible par l’enfant dans le même aperçu.
- Des états de mission effectivement présents dans la maquette : mission reçue ou en cours, progression, problèmes et aide contextualisée, puis clôture locale « préparation renseignée » lorsque tous les items ont été traités. L’absence de mission et les états d’erreur ou de chargement seront ajoutés avec les parcours connectés qui les rendent nécessaires.
- Une identité graphique originale, mobile-first, avec mouvement bref et respect de `prefers-reduced-motion`.

La V0 n’implémente pas d’authentification, d’appairage réel, de RLS, de sauvegarde Supabase, de synchronisation entre appareils, de notification push, de file d’attente hors ligne, de calcul serveur XP ou de vraie révocation d’appareil. L’interface doit rendre ces limites visibles en mode démo plutôt que simuler une garantie. La clôture V0 est un simple état de présentation, sans statut métier `completed`.

Une première tranche connectée distincte prépare le compte parent et sa bibliothèque de modèles : le parent peut modifier les modèles fournis, leur description et leurs affaires, ajouter ou retirer une affaire, puis enregistrer le résultat pour le retrouver sur son compte. Cette tranche requiert un projet Supabase configuré et sa migration RLS appliquée. Elle ne rend pas persistantes la mission active ni les données de l’aperçu enfant ; les modifications d’un modèle ne changent pas une mission déjà créée.

### 4.2 Périmètre du MVP connecté

Le MVP complet vise les capacités suivantes :

1. inscription, connexion et déconnexion du parent ;
2. création du foyer et d’un profil enfant ;
3. association sécurisée et révocation de l’appareil enfant ;
4. création, modification, réordonnancement et suppression de modèles, catégories et items ;
5. création d’une mission indépendante d’un modèle, personnalisation, envoi, démarrage et clôture ;
6. checklist enfant avec quantités et états `pending`, `packed`, `not_found`, `missing` ;
7. suivi parent, problèmes signalés et réponse d’aide contextualisée ;
8. historique des missions ;
9. progression positive de base, dont XP, niveau et badges ; toute attribution est déterministe et idempotente ;
10. PWA installable et poursuite de la checklist déjà chargée en cas de coupure réseau, avec synchronisation maîtrisée.

La clôture métier, les règles de gamification et le mécanisme de session enfant doivent être précisés avant leur implémentation serveur.

### 4.3 Hors MVP

IA, réseau social, classement entre enfants, messagerie générale, photos d’enfant, géolocalisation, marketplace, monnaie virtuelle, achats intégrés, calendrier complexe, intégration scolaire/ENT, reconnaissance d’objets par caméra et statistiques comportementales détaillées.

Les notifications push natives, missions récurrentes automatiques, plusieurs comptes parentaux, widgets, avatars évolutifs et suggestions intelligentes pourront être étudiés en V2.

## 5. Parcours principaux

### Parent

```text
Créer un compte
→ créer le foyer et le profil enfant
→ choisir ou créer un modèle
→ préparer une mission et choisir une période
→ envoyer la mission
→ suivre la progression et répondre aux problèmes
→ consulter le résultat dans l’historique
```

### Enfant

```text
Associer l’appareil une première fois
→ voir la mission reçue
→ la commencer
→ traiter les affaires une par une
→ demander de l’aide pour un item si nécessaire
→ terminer la démonstration lorsque tous les items ont un état
```

### Parent, retour d’internat

Le même moteur de checklist sert aux deux sens : préparer le départ vers l’internat et vérifier les affaires rapportées au retour. Le modèle choisit le contenu correspondant ; aucun deuxième moteur de mission n’est nécessaire.

## 6. Missions, modèles et règles métier

### Modèle

Un modèle appartient à un foyer et contient des catégories ordonnées et des items. Un item comprend au minimum un libellé, une quantité, une position et un caractère obligatoire ou facultatif. Le parent peut créer, renommer, dupliquer, modifier, réordonner et supprimer ses modèles.

Créer une mission depuis un modèle en copie le contenu. Les modifications ultérieures du modèle ne changent pas une mission envoyée ni une mission historique.

### Mission

Une mission concerne un profil enfant et une période/date, et contient une copie indépendante des catégories et items. Les transitions prévues sont `draft → sent → started → completed`, avec annulation contrôlée selon l’étape. Les règles sont regroupées dans une logique métier canonique.

### État des affaires

- `pending` : l’enfant ne l’a pas encore traitée ;
- `packed` : l’affaire est dans le sac ;
- `not_found` : l’affaire existe mais l’enfant ne la trouve pas ;
- `missing` : elle n’est pas disponible.

**Règle de V0, limitée à la démonstration :** une affaire est « traitée » si son état n’est plus `pending`. L’enfant peut afficher la clôture locale « préparation renseignée » si tous les items ont été traités. L’interface distingue toujours « préparation renseignée » de « valise prête » et conserve le décompte des items `not_found` et `missing`. Cette convention de démonstration ne constitue ni un statut métier `completed` ni la règle de clôture du produit connecté.

**Décision métier à confirmer avant le backend :** déterminer si une mission peut être `completed` lorsque des items sont `not_found` ou `missing`, comment les quantités partielles sont traitées, et si un item facultatif laissé `pending` bloque la clôture. Ne pas appeler « valise prête » une mission qui contient encore des problèmes.

## 7. Écrans et navigation

### Parent

Navigation cible : `Accueil`, `Missions`, `Modèles`, `Progression`, `Famille`, `Paramètres`.

Écrans MVP : `/auth`, `/onboarding`, `/home`, `/family`, `/family/:childId`, `/templates`, `/templates/:id`, `/missions`, `/missions/new`, `/missions/:id`, `/progression/:childId`, `/settings`.

Le tableau de bord montre l’enfant, la mission active, la progression, les items à traiter et les demandes d’aide. Il privilégie les situations qui appellent une action du parent.

### Enfant

Navigation réduite à `Mission`, `Progression`, `Récompenses`, `Profil`. Écrans cibles : `/join`, `/mission`, `/mission/:id`, `/progression`, `/rewards`, `/profile`.

La V0 privilégie `/mission` et `/mission/:id`, ainsi que l’aperçu parent correspondant. L’enfant travaille catégorie par catégorie avec des actions explicites : « C’est dans la valise », « Je ne le trouve pas », « Il n’en reste plus ». L’interface répond immédiatement sans animation bloquante.

## 8. Aide parentale

Une demande d’aide est liée à un item : message court de l’enfant, réponse courte du parent, état ouvert/résolu et dates utiles. La fonctionnalité n’autorise ni salon, ni message libre sans rapport avec une mission, ni conversation de groupe.

La V0 simule l’aller-retour dans l’état local. Le MVP connecté doit contrôler l’accès côté serveur, afficher une alerte au parent et refléter sa réponse sur l’appareil enfant.

## 9. Progression et gamification

La gamification du MVP s’appuie sur XP, niveaux, séries et badges déterministes. Les récompenses restent principalement cosmétiques : effets visuels, arrière-plan, cadre ou emblème original. Aucune loot box, monnaie virtuelle ou dépense n’est prévue.

Le serveur est l’autorité pour les événements XP, niveaux, séries et badges. Les événements ont une raison stable et une clé d’idempotence ; une répétition ou une reconnexion ne doit jamais doubler une récompense. Les valeurs proposées dans le PRD d’origine (`+5` par item, `+20` par catégorie, `+100` par mission, bonus de mission) sont indicatives, pas un barème final.

Ne récompense pas la vitesse, la perfection ou l’absence de demande d’aide d’une façon qui pousserait l’enfant à cacher une difficulté. Demander de l’aide ne doit entraîner aucune pénalité et ne doit pas retirer un succès acquis. La définition d’un bonus d’autonomie et des badges « éclair » ou « parfait » reste à confirmer ; ils ne font pas partie de la V0.

Une série encourage la régularité sans effacer tout le progrès après une semaine manquée. Le bouclier de série est une piste V2 tant que ses règles ne sont pas définies.

La V0 peut montrer un exemple visuel de progression, mais ne calcule ni ne persiste de récompense réelle.

## 10. Identité visuelle et propriété intellectuelle

PackQuest peut s’inspirer des conventions générales du shōnen d’action et de l’énergie associée à Dragon Ball / Dragon Ball Z : entraînement, dépassement de soi, rivalité, amitié, progression, humour, halos ou particules d’énergie, lignes de vitesse et célébration. Il n’est pas nécessaire d’écarter ces idées de genre par principe.

L’expression concrète doit rester propre à PackQuest. Ne réutilise pas sans autorisation les personnages, noms distinctifs, silhouettes, costumes, emblèmes, logos, attaques nommées, objets, lieux, espèces, scènes, dialogues, musiques, illustrations ni combinaison reconnaissable de ces éléments. Ne renomme pas simplement une copie. Les avatars, symboles, récompenses, palettes, noms et éléments narratifs de PackQuest doivent être originaux ou dûment licenciés.

Ces consignes de création réduisent le risque sans garantir l’absence de litige. La propriété intellectuelle peut relever du droit d’auteur et d’autres droits, notamment des marques ; vérifier les ressources et noms avant toute exploitation commerciale et demander un avis spécialisé en cas de ressemblance persistante. Repères : [Code de la propriété intellectuelle, article L. 111‑1](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000042814694/), [article L. 122‑4](https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006278911/) et [Office européen de la propriété intellectuelle : idées et expression](https://intellectual-property-helpdesk.ec.europa.eu/news-events/news/public-domain-2020-11-19_en).

## 11. Confidentialité et sécurité

Le produit ne requiert pas par défaut de nom complet, adresse, établissement scolaire, date de naissance exacte, téléphone, localisation, contacts, photo ou donnée biométrique. Le profil enfant peut se limiter à un prénom d’usage ou pseudo, un avatar choisi et un identifiant technique.

Les foyers sont isolés dans la base. Le frontend ne constitue jamais une frontière de sécurité : chaque table métier protégée reçoit des politiques RLS explicites pour `SELECT`, `INSERT`, `UPDATE` et `DELETE`, selon les opérations réellement permises à chaque rôle. Les Edge Functions et autres contrôles serveur complètent ces politiques pour l’appairage et les opérations privilégiées ; ils ne remplacent pas la RLS des tables protégées. Les clés privées et `service_role` ne sont jamais livrées au navigateur.

Le schéma du PRD d’origine est conceptuel, pas un contrat de migration. L’implémentation locale utilise une capacité d’appareil révocable, validée par la fonction Edge à chaque requête et rattachée à un seul profil enfant. La lecture parent passe par RLS ; les écritures enfant passent par les opérations serveur réservées au service. Aucun `user_id` Auth n’est créé pour l’enfant.

Chaque table protégée doit être limitée à un foyer par une clé `family_id` directe ou un chemin relationnel documenté et vérifié par RLS. `mission_items`, demandes d’aide, événements XP et autres tables enfants ne doivent pas dépendre d’un simple filtrage frontend. Les jetons d’appairage doivent expirer, être à usage unique, stockés sous forme hachée et échangés côté serveur/Edge Function ; leur valeur brute ne va ni dans les journaux ni dans une URL durable.

La révocation d’un appareil doit invalider son accès côté serveur. Un écran de confidentialité enfant explique en termes simples l’usage des données, sans promettre une collecte ou une synchronisation qui n’existe pas encore.

## 12. Architecture et plateforme

Application unique, responsive et organisée par fonctionnalités :

```text
src/
  app/
  components/
  features/
    auth/ family/ children/ pairing/ templates/ missions/
    checklist/ gamification/ notifications/ profile/
  hooks/ lib/ services/ types/
```

Stack visée : React, TypeScript strict, Vite, Tailwind CSS, React Router, Lucide React, Supabase PostgreSQL/Auth/Realtime/Edge Functions, Netlify. Utiliser Supabase Realtime uniquement pour les changements de mission qui gagnent à apparaître immédiatement. Storage n’est ajouté que lorsqu’un besoin de fichiers est validé.

La structure reste compatible avec une PWA et un futur emballage Capacitor. Le manifeste, les icônes et l’installation ne doivent pas être confondus avec une véritable synchronisation hors ligne.

## 13. Réseau, offline et expérience d’interface

La checklist déjà chargée doit pouvoir être consultée et modifiée pendant une perte temporaire de réseau dans le MVP connecté. Les mutations hors ligne utilisent un stockage local adapté, un identifiant client et une réconciliation explicite ; aucune règle naïve de dernière écriture ne doit rouvrir une mission terminée ni dupliquer XP ou badges.

La V0 reste en mémoire, met à jour immédiatement l’aperçu local et réinitialise les données au rechargement ; elle ne promet ni fonctionnement hors ligne, ni synchronisation, ni reprise après échec réseau. Dans le MVP connecté, les opérations simples peuvent être optimistes si l’interface indique un échec ou une action à resynchroniser sans perdre la saisie.

Concevoir mobile-first : téléphone enfant prioritaire ; parent utilisable sur téléphone, tablette et ordinateur. Utiliser des tokens sémantiques (`background`, `surface`, `text-primary`, `energy-primary`, `success`, `warning`, `danger`), des cibles tactiles confortables, un contraste suffisant, un focus clavier visible, un libellé textuel pour les icônes et `prefers-reduced-motion`. Une couleur seule ne porte jamais l’état.

Toute vue asynchrone définit chargement, erreur, absence de données et succès. Les erreurs enfant sont simples et non techniques. Les animations de validation restent courtes et ne bloquent pas l’action.

## 14. PWA et performance

Le MVP vise une application installable, plein écran, avec manifeste et icônes. Le cache permet au minimum de charger les ressources de l’application ; la reprise réelle de checklist est une exigence distincte qui inclut données locales et synchronisation.

Les interactions de checklist doivent sembler immédiates sur mobile. Éviter les bundles et animations lourds, images volumineuses, abonnements Realtime inutiles et appels redondants.

## 15. Historique, notifications et indicateurs

Le parent consulte les missions passées avec période, statut et résultat. Les notifications dans l’application signalent une mission envoyée, une demande d’aide, un démarrage ou une fin. Les push PWA/natives sont hors V0 et ne sont activées qu’après validation technique et produit.

KPI produit envisagé : taux de missions terminées. Les autres pistes sont les oublis, demandes d’aide, réutilisations de modèles et missions réalisées sans intervention. Aucun suivi analytique détaillé d’enfants n’est nécessaire à la V0 ; toute mesure ultérieure doit être proportionnée, expliquée et approuvée dans le cadre de la politique de données.

L’indicateur d’autonomie, s’il est construit plus tard, mesure une évolution de parcours et ne note ni ne compare l’enfant.

## 16. Découpage de développement

Développer par tranches verticales, sans lancer des étapes dépendantes en parallèle :

1. **V0 frontend :** socle visuel, navigation de démonstration, aperçu parent-enfant, mission et checklist partagées en mémoire ;
2. **Compte parent et modèles :** configuration Supabase, authentification parent, foyer individuel et édition persistante de la bibliothèque de modèles ;
3. **Identité enfant :** profil, modèle de session d’appareil, appairage sécurisé et révocation ;
4. **Missions :** création depuis un modèle, copie indépendante, transitions et envoi ;
5. **Checklist et aide :** autorisations serveur, problèmes contextualisés et suivi parent ;
6. **Progression :** XP, niveau, séries et badges idempotents ;
7. **PWA et offline réel :** stockage local, file de mutations, conflit et reprise ;
8. **Stabilisation du MVP :** accessibilité, performance, sécurité et parcours complets.

La tranche V0 peut être montrée et revue sans credentials Supabase. Les phases connectées ne commencent pas par des données de démonstration présentées comme persistantes.

## 17. Critères d’acceptation

### V0 frontend

- Le projet démarre et présente une interface en français, responsive, sur viewport smartphone et desktop.
- Un repère permanent identifie la V0 comme démonstration non connectée.
- L’aperçu parent montre enfant, mission, progression et problèmes.
- L’aperçu enfant démarre la même mission et permet de modifier l’état de chaque item entre `pending`, `packed`, `not_found` et `missing`.
- La progression et les problèmes sont actualisés dans les deux aperçus pendant la session ; les données sont synthétiques et peuvent se réinitialiser au rechargement.
- Un échange d’aide peut être démontré sur un item sans devenir un chat.
- Quand tous les items sont traités, l’enfant peut afficher « préparation renseignée » ; les problèmes restent visibles et aucune valise n’est déclarée prête par ce seul état.
- La V0 distingue les items traités de la valise réellement prête et n’attribue pas de XP serveur.
- Navigation clavier/focus, contraste, libellés et préférence de réduction des animations sont pris en compte.
- Aucune interface ne prétend protéger des données ou comptes qu’elle ne gère pas.

### Première tranche compte et modèles

- Le parent peut créer un compte ou se connecter ; une famille est créée et isolée pour son compte.
- Tous les modèles de la bibliothèque du compte sont modifiables : nom, description, catégorie, libellé, quantité et caractère indispensable.
- Le parent peut ajouter et supprimer des affaires, enregistrer explicitement ses changements et les retrouver après une nouvelle connexion.
- Les données restent liées à la famille côté serveur par RLS ; une sauvegarde obsolète provenant d’un autre onglet est refusée plutôt que d’écraser silencieusement la version récente.
- La mission active et l’aperçu enfant demeurent des démonstrations en mémoire tant que leur tranche persistante n’est pas livrée.

### MVP connecté

Le MVP est fonctionnel seulement lorsque parent et enfant peuvent exécuter leurs parcours de bout en bout sur données persistantes, avec la session enfant et les permissions définies côté serveur, les modèles copiés en missions indépendantes, la progression sans doublon, les états d’erreur, l’historique et une checklist résiliente aux coupures prévues.

## 18. Definition of Done et vérification

Pour le MVP connecté, la livraison devra couvrir TypeScript, responsive, états de chargement/erreur/vide, navigation, accessibilité, persistance, sécurité des secrets, RLS et permissions. La stratégie et l’exécution des tests sont soumises aux instructions globales et à `AGENTS.md` : ne pas ajouter ni exécuter de tests sans demande explicite de l’utilisateur. Une exigence de sécurité qui n’a pas été vérifiée empêche de présenter cette partie comme validée ou prête pour la production.

Pour chaque livraison, distinguer clairement ce qui est codé localement, ce qui a été vérifié, et ce qui dépend encore d’un backend, d’une décision produit, d’une fusion ou d’un déploiement.

## 19. Décisions produit à confirmer avant le MVP connecté

1. Tranche d’âge et niveau de lecture visés ;
2. traitement des quantités partielles et des items facultatifs ; la fin de mission accepte déjà les états `packed`, `not_found` et `missing` pour chaque affaire, mais aucun `pending` ;
3. durée de conservation locale et procédure de récupération après perte d’un appareil ; le principe de session enfant sans compte Auth, association par QR et révocation d’appareil est retenu ;
4. nombre de parents autorisés en MVP et garde alternée ;
5. barème XP, règles de série et badges qui ne pénalisent pas les demandes d’aide ;
6. périmètre exact des notifications ;
7. arbitrage détaillé d’un conflit de checklist entre deux appareils ; la file hors ligne et le blocage explicite d’un conflit sont retenus.

Ces décisions ne bloquent pas la V0 visuelle tant qu’elle reste explicitement locale et en démonstration.

## 20. North Star

> Cette fonctionnalité aide-t-elle réellement l’enfant à préparer ses affaires plus facilement et plus autonomement ?

Le parent organise, l’enfant agit, l’application guide et la progression encourage. La mission est de réduire les frictions familiales avec le plus petit produit robuste possible.
