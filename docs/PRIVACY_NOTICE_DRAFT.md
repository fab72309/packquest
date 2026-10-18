# Notice de confidentialité PackQuest — service connecté

**Statut : brouillon de travail, à compléter et valider avant l’ouverture des comptes de test.**

Cette notice décrit les traitements prévus par le code actuel. Elle ne vaut pas notice publiée : l’identité du responsable, les choix de base juridique, les durées de conservation, le point de contact et les conditions des prestataires restent à confirmer.

## Responsable et contact

- Responsable du traitement : **à renseigner** (personne ou structure qui exploite PackQuest).
- Adresse de contact pour les demandes sur les données : **à renseigner**.
- Délégué à la protection des données : **à renseigner si un DPO est désigné**.

## Données et usages prévus

PackQuest prévoit de traiter les données suivantes pour fournir les fonctions du service :

- compte parent : adresse e-mail et données d’authentification gérées par Supabase Auth ;
- connexion Google, si elle est activée : identifiant et données de profil autorisées par les scopes `openid`, e-mail et profil ;
- famille et profil enfant : identifiant technique, prénom d’usage ou pseudonyme, avatar choisi ;
- modèles et missions : noms de modèles, catégories, affaires, quantités, période, états de checklist et dates de progression ;
- aide contextuelle : court message de l’enfant et réponse du parent associés à une affaire ;
- appairage : empreintes hachées des jetons d’appairage et d’appareil, état de révocation, dates de création et de dernière activité ;
- stockage navigateur : session persistante du parent, copie locale de la mission chargée, actions en attente et jeton d’appareil dans IndexedDB ;
- sécurité et synchronisation : identifiants, versions et reçus de mutation nécessaires à la reprise idempotente.

Le code ne demande pas par défaut la date de naissance exacte, l’adresse, l’école, la localisation, les contacts, une photographie ou une donnée biométrique. N’inscrire dans les champs libres aucune donnée qui n’est pas nécessaire à la mission.

## Finalités et bases juridiques

Les finalités prévues sont la création et la gestion du compte parent, la gestion des profils familiaux, la préparation et le suivi des missions, l’appairage d’un appareil enfant, la synchronisation hors ligne, la sécurité et le traitement des demandes d’aide.

La base juridique doit être déterminée et validée par le responsable pour chaque finalité avant publication. Les champs obligatoires ou facultatifs et les conséquences d’un refus doivent également être précisés.

## Destinataires et prestataires

- Les membres autorisés d’une même famille accèdent aux informations nécessaires à leurs fonctions, selon les contrôles d’accès du service.
- Supabase héberge l’authentification, la base de données et la fonction serveur. Le projet PackQuest observé est hébergé dans la région `eu-west-3` (Paris) ; les conditions contractuelles et les traitements éventuels hors de l’EEE restent à vérifier.
- Google recevra les demandes nécessaires à la connexion si le fournisseur Google est activé. Les identifiants OAuth doivent rester côté serveur.
- Le fournisseur d’e-mail de confirmation et de récupération de compte reste à identifier et documenter.
- GitHub Pages héberge la version de démonstration et indique enregistrer l’adresse IP des visiteurs à des fins de sécurité. Voir sa [déclaration de confidentialité](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement).

Aucun SDK publicitaire ou de mesure d’audience n’a été repéré dans le code examiné. Les contrats, sous-traitants ultérieurs, transferts et garanties applicables doivent être vérifiés avant l’utilisation de données réelles.

## Durées et suppression

Les durées ne sont pas encore fixées. Le responsable doit préciser les règles distinctes pour les comptes, profils, modèles, missions terminées, demandes d’aide, reçus de mutation, journaux et sauvegardes.

Le code conserve les missions terminées et leurs items comme historique. Les reçus de mutation sont liés à un appareil et contiennent une requête et une réponse JSON ; aucune purge automatique n’est définie dans le dépôt. La suppression du compte, l’export des données et le traitement d’une demande de droits ne disposent pas encore d’un parcours utilisateur documenté.

Les données déjà copiées hors ligne sur un appareil qui reste sans réseau ne peuvent pas être effacées à distance. La révocation bloque l’accès serveur à la prochaine connexion ; l’effacement local doit être décrit et rendu accessible.

## Droits et contact

Le responsable devra indiquer comment exercer les droits d’accès, de rectification, d’effacement, de limitation, d’opposition ou de portabilité selon la base juridique retenue, ainsi que le délai et les informations nécessaires au traitement de la demande. Une réclamation peut être adressée à la [CNIL](https://www.cnil.fr/fr/plaintes).

**Adresse pour exercer ces droits : à renseigner avant publication.**

## Décisions requises pour finaliser

1. Nom légal et coordonnées publiques de la personne ou structure responsable.
2. Adresse dédiée aux demandes de confidentialité et éventuel DPO.
3. Bases juridiques retenues par finalité, y compris le traitement des données des enfants.
4. Durées et règles de suppression pour comptes, données familiales, missions, reçus de mutation, sauvegardes et données hors ligne.
5. Procédure d’export/suppression et personne chargée de répondre aux demandes.
6. Fournisseur SMTP, contrats Supabase/Google/GitHub applicables, sous-traitants ultérieurs et transferts éventuels.
7. Confirmation que les écrans d’inscription et d’usage enfant renvoient à cette notice avant toute collecte réelle.
