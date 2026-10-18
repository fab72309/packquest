# PackQuest

PackQuest aide une famille à préparer un sac ou une valise. Le parent crée et suit la mission ; l’enfant rejoint son profil par QR code et renseigne les affaires sans compte e-mail.

## Parcours disponibles localement

- `/` : choix clair entre parent et enfant.
- Parent : inscription/connexion par e-mail ou Google, profils enfant, QR code d’appairage, modèles, création et envoi de missions, suivi et historique.
- Enfant : lecture du QR code ou du lien, missions, checklist, problème ou demande d’aide, fin de mission.
- Hors ligne : une mission déjà chargée reste accessible. Les changements sont conservés dans IndexedDB, puis rejoués avec des identifiants de mutation stables au retour du réseau. Un conflit demande une résolution explicite.
- PWA : le shell et les ressources statiques sont précachés dans le build de production. Les réponses de l’API ne sont pas mises en cache par le service worker.

Les données et droits serveur sont définis par les migrations dans `supabase/migrations/` et la fonction `supabase/functions/packquest/`. La famille est la frontière de lecture parent (RLS). L’enfant dispose d’un jeton d’appareil révocable, contrôlé côté serveur à chaque requête. Les QR codes sont temporaires, à usage unique ; seuls leurs hachages sont stockés.

Les routes de démonstration utilisent des données fictives en mémoire. Elles sont accessibles en développement et dans la version GitHub Pages de test (`VITE_DEMO_MODE=true`) ; elles ne sont pas reliées au compte parent.

## Démarrage

```bash
npm install
npm run dev
```

Créer `.env.local` depuis `.env.example` avec l’URL Supabase et la clé **publique**. Ne jamais placer la clé `service_role` ou des identifiants Google dans le frontend. `npm run build` compile la version de production ; `npm run lint` vérifie le code.

## Connexion Google sur Android

L’application Android ouvre Google dans le navigateur système, puis attend le retour exact `packquest://auth-callback`. Le passage par `https://ujvqqqysjppgxagyumbn.supabase.co/auth/v1/callback` est normal : cette adresse reste le callback autorisé du client Google. Le retour final doit ouvrir PackQuest, sans passer par une preview locale.

Dans le projet Supabase hébergé PackQuest (`ujvqqqysjppgxagyumbn`), **Authentication → URL Configuration → Redirect URLs** doit contenir `packquest://auth-callback` en conservant les autres URL nécessaires au web. Le fichier `supabase/config.toml` configure seulement le développement local ; son édition ne met pas à jour la console distante. Un retour vers une adresse locale peut indiquer que l’URI Android n’est pas autorisée ou qu’une ancienne version de l’app utilise encore un retour web. Vérifier la configuration distante et la version installée pour trancher.

Le 2 octobre 2026, l’absence de cette URI a été constatée dans la console distante : seules les quatre adresses de développement ci-dessus étaient autorisées. `packquest://auth-callback` a été ajouté et la console a confirmé « Successfully added 1 URL », avec cinq adresses au total. Les quatre adresses existantes et la Site URL ont été conservées. Cela confirme le réglage serveur, sans valider une connexion Google complète sur appareil Android.

Après intégration des corrections, reconstruire les ressources web et les synchroniser avec Android avant de produire une nouvelle version installable. Les ressources Android et AAB déjà générées ne sont pas modifiées par une édition des sources. Sur un appareil, vérifier la connexion Google avec l’app ouverte et après relancement, ainsi que l’annulation de la connexion. La date de naissance se saisit directement (jour, mois, année) ; elle reste en mémoire pendant la saisie et est effacée après validation.

## Signature et release Android

La version Android préparée est `1.0.3` (`versionCode 4`). La signature charge un fichier privé externe au dépôt : `~/.config/packquest-android-upload/signing.properties`, ou le chemin indiqué par `PACKQUEST_SIGNING_PROPERTIES`. Il contient `storeFile`, `storePassword`, `keyAlias` et `keyPassword`. Les builds release et sideload refusent une configuration absente, une clé manquante ou un certificat différent de la clé PackQuest enregistrée dans Google Play. Ne jamais committer ce fichier ni la clé privée.

Une clé de remplacement a été créée localement car la clé d’importation attendue par Google Play n’a pas été retrouvée. Son certificat public SHA-256 est `18:8B:9B:91:79:2E:9E:5B:2A:92:BD:76:F0:F0:CB:50:01:CD:7B:A3:A6:55:28:B6:73:9B:E1:89:78:8C:D7:8F`. Le bundle `android/app/build/outputs/bundle/release/PackQuest-1.0.2-3.aab` est signé avec cette clé. **Publié en test interne le 7 octobre 2026**, après activation de la nouvelle clé d’importation et acceptation de ce bundle signé par Google Play. Le certificat PEM public est disponible dans le même dossier sous `PackQuest-upload-certificate.pem` ; les secrets restent en dehors du dépôt.

Vérification distante du 4 octobre 2026 : Google Play affiche ce nouveau certificat et une demande encore en attente. Le courriel Google du 2 octobre annonce l’activation le **4 octobre 2026 à 20:49 UTC, soit 22:49 à Paris**, avec blocage des imports jusque-là. La cible autorisée reste le **test interne**, package `com.packquest.app`, application Play `4972619485678581482`, compte développeur `6488199734378988515`. Après activation, vérifier l’acceptation de l’AAB puis l’état effectif de la release sur cette piste.

Vérification du 7 octobre 2026 : le certificat d’importation correspond à la clé locale, sans demande en attente. Google Play a accepté le bundle `3 (1.0.2)` ; après confirmation de publication, le canal Tests internes affiche **Actif**, **Dernière release : 3 (1.0.2)** et **Accessible aux testeurs internes**. Release console `2`, SHA-256 du fichier envoyé `8b0affc51cdf999d3194c59c82e116a1b4fc7bfcd10c5f17c238da69418a7a85`. Cela confirme la disponibilité sur la piste, pas l’installation ou la connexion sur téléphone. Aucun déploiement en production ni changement de liste de testeurs. L’unique avertissement concerne le fichier de désobscurcissement, non applicable au build avec `minifyEnabled false`.

Pour préparer les prochaines releases, utiliser `bash scripts/android-release.sh` : cette procédure reconstruit les ressources web hors démo, synchronise Capacitor et compile le bundle avec Java 21 et la clé existante. Elle ne téléverse ni ne publie automatiquement. La compilation avec les contrôles de clé a réussi le 4 octobre 2026.

Une copie privée de secours a été vérifiée dans `~/Documents/DevApp/Clés Android studio/PackQuest-keys/` (dossier 700, fichiers 600). Pour restaurer la configuration, remettre les trois fichiers dans `~/.config/packquest-android-upload/`. **Ne pas générer une nouvelle clé pour une mise à jour** ; restaurer celle-ci si elle manque. Cette sauvegarde est sur le même Mac : elle protège d’une suppression du dossier de configuration, pas d’une perte du Mac. Une sauvegarde externe chiffrée reste à organiser. Ne jamais envoyer les fichiers privés dans Git, un AAB ou les notes de release.

## APK de test installé directement

Le build Android `sideload` produit **PackQuest Test**, identifiant `com.packquest.app.test`, version `1.0.3-test` (4). Il utilise la signature locale externe décrite ci-dessus et peut cohabiter avec PackQuest installé depuis Google Play. Il utilise les mêmes services Supabase réels ; ce n’est pas une démonstration avec des données fictives. Il faut se connecter dans cette installation distincte.

Pour le reconstruire : `VITE_BASE_PATH=/ VITE_DEMO_MODE=false npm run build`, puis `npx cap sync android`, puis depuis `android/`, `JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home ./gradlew assembleSideload`. L’APK se trouve dans `android/app/build/outputs/apk/sideload/app-sideload.apk`.

Le 4 octobre 2026, ce build a réussi et `apksigner verify` a confirmé la signature APK v2. Le fichier remis est `~/Downloads/PackQuest-Test-1.0.2-3.apk`. Aucun essai sur téléphone n’a été effectué. Lors du retour OAuth `packquest://auth-callback`, si les deux applications sont installées, choisir **PackQuest Test** dans le sélecteur Android. Les mises à jour de cet APK sont manuelles.

## État de validation

État observé le 27 septembre 2026 : le projet Supabase PackQuest (`ujvqqqysjppgxagyumbn`) a enregistré les cinq migrations de ce dépôt, avec leurs versions de fichier. La fonction Edge `packquest` est active en version 1 avec authentification parent ou appareil contrôlée dans son code. Google OAuth est activé dans Supabase Auth et configuré dans Google Auth Platform pour les parcours locaux sur le port 5173 ; le compte `fabien.deabreulopes@gmail.com` est le seul utilisateur de test autorisé. L’écran Google reste en mode Test : avant une ouverture publique, renseigner les liens publics de l’application et de sa politique de confidentialité, terminer le branding Google et ajouter les URL du domaine déployé dans Google et Supabase. Aucun parcours Google complet ni parcours avec deux appareils réels n’a encore été validé.

La notice complète du service connecté est un [brouillon à finaliser](docs/PRIVACY_NOTICE_DRAFT.md). Le workflow GitHub Pages publie uniquement une démo sans Supabase, avec des données fictives. Avant d’ouvrir les comptes réels, suivre [la préparation sécurité et données](docs/SECURITY_PRIVACY_RELEASE.md). Le [PRD](docs/PRD.md) reste la référence produit et signale encore des décisions à confirmer.
