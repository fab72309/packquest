# PackQuest — sécurité et données avant publication

## État observé le 27 septembre 2026

- Le projet Supabase hébergé « PackQuest » est actif dans la région `eu-west-3`.
- Trois des quatre migrations présentes dans ce dépôt sont enregistrées à distance ; `20260927070328_child_pairing_missions_history` reste à appliquer.
- Aucune fonction Edge n’est actuellement déployée sur ce projet.
- La connexion Google est prévue dans l’interface, mais le fournisseur doit encore être configuré dans Google Auth Platform et Supabase Auth.
- La notice complète du service connecté est en brouillon dans [`PRIVACY_NOTICE_DRAFT.md`](PRIVACY_NOTICE_DRAFT.md) ; les informations listées à la fin manquent encore.

La prévisualisation GitHub Pages préparée ici est une démo sans identifiants Supabase. Elle ne crée pas de comptes et utilise des données fictives en mémoire. GitHub indique enregistrer l’adresse IP des visiteurs de Pages à des fins de sécurité ; le lien vers sa déclaration apparaît dans la page de confidentialité de la démo. Cette prévisualisation ne valide ni le backend ni les comptes réels.

## Ce que le code prévoit

- Le parent s’authentifie par Supabase Auth. Google utilise le flux OAuth Supabase ; l’application ne reçoit pas le mot de passe Google.
- L’enfant ne donne ni e-mail ni mot de passe. Un QR code contient un secret aléatoire de 256 bits, valable dix minutes et utilisable une seule fois. Le serveur ne conserve que son hachage.
- Après appairage, un jeton d’appareil révocable donne accès seulement au profil de cet enfant. Les tables métier sont protégées par RLS ; les opérations enfant et les transitions de mission sont contrôlées par la fonction Edge et les RPC réservées au service.
- Une mission copie les items du modèle. Son historique conserve la liste, les états et la date de fin même si le modèle change ensuite.
- La checklist déjà chargée fonctionne hors ligne. Son cache et le jeton d’appareil sont stockés dans IndexedDB sur l’appareil enfant. Les mutations sont rejouées avec un identifiant stable ; une version divergente bloque la file au lieu d’écraser silencieusement une action.
- Révoquer un appareil coupe l’accès serveur dès sa prochaine connexion. Les données déjà copiées sur un appareil qui reste hors ligne ne peuvent pas être effacées à distance ; l’enfant peut retirer localement sa famille depuis son espace.
- Aucun SDK publicitaire ou de suivi commercial n’est intégré. Le texte d’inscription annonce que PackQuest ne vend pas les données familiales et ne les utilise pas pour la publicité.

## Conditions avant un déploiement

1. Appliquer les migrations versionnées sur le **projet Supabase cible**, puis vérifier les droits RLS et les colonnes sensibles avec des comptes parent de deux familles et un appareil enfant. Vérifier une restauration de sauvegarde avant de charger des données familiales réelles.
2. Déployer la fonction `packquest` et configurer `PACKQUEST_ALLOWED_ORIGINS` avec l’origine HTTPS exacte de l’application. La fonction a `verify_jwt=false` parce que l’enfant n’a pas de JWT Supabase ; elle vérifie elle-même chaque jeton parent ou appareil. Confirmer cette configuration sur le projet cible.
3. Configurer le fournisseur Google dans Google Auth Platform et Supabase Auth : identifiants OAuth côté serveur, origine du site, URL callback Supabase et redirection `/parent/account`. Ajouter aussi les redirections de confirmation e-mail et de récupération du mot de passe. Activer confirmation des e-mails et un service SMTP adapté.
4. Rédiger puis afficher la notice complète de confidentialité : responsable de traitement et contact, finalités, base juridique, destinataires/sous-traitants, durées de conservation, droits et procédure d’exercice. Définir suppression/export des données et la durée de conservation des reçus de mutation. Vérifier que les paramètres et contrats des fournisseurs sont compatibles avec la promesse d’absence d’usage commercial des données.
5. Contrôler sur téléphone étroit et sur deux appareils réels : compte parent e-mail et Google, création de profil, scan QR, expiration/usage unique, révocation, mission, demande d’aide, historique, coupure réseau, fermeture et réouverture de la PWA, conflit et synchronisation. Vérifier les réponses et l’état distant, pas seulement un build ou une réponse HTTP.

6. Pour activer la version connectée sur GitHub Pages, vérifier les règles de visibilité Pages du dépôt, configurer les variables publiques de build Supabase uniquement après la finalisation de la notice, puis ajouter l’origine du site et l’URL de redirection exacte dans Supabase Auth et Google Auth Platform. La démo préparée par le workflow ne reçoit volontairement aucune variable Supabase.

La sécurité peut être conçue et vérifiée par des mesures concrètes ; aucune application ne peut promettre un risque nul. Le déploiement connecté sur Supabase et sa validation distante restent à faire ; la démo GitHub Pages ne valide pas ces étapes.

Références : [Supabase Auth Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [sécurisation des Edge Functions](https://supabase.com/docs/guides/functions/auth), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [information des personnes selon la CNIL](https://www.cnil.fr/fr/conformite-rgpd-information-des-personnes-et-transparence) et [sécurité des données selon la CNIL](https://www.cnil.fr/fr/passer-laction/garantir-la-securite-des-donnees).
