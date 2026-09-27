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

## État de validation

État Supabase observé le 27 septembre 2026 : le projet PackQuest a enregistré les trois premières migrations de ce dépôt ; `20260927070328_child_pairing_missions_history` reste à appliquer et aucune fonction Edge n’y apparaît. Google OAuth reste à configurer. Les parcours avec deux appareils réels ne sont pas validés.

La notice complète du service connecté est un [brouillon à finaliser](docs/PRIVACY_NOTICE_DRAFT.md). Le workflow GitHub Pages publie uniquement une démo sans Supabase, avec des données fictives. Avant d’ouvrir les comptes réels, suivre [la préparation sécurité et données](docs/SECURITY_PRIVACY_RELEASE.md). Le [PRD](docs/PRD.md) reste la référence produit et signale encore des décisions à confirmer.
