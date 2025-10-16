# Setup and Installation

<!-- Source: /README.md -->

## Installation de l'environnement de développement

Pré-requis :
- Node.js version 20
- pnpm
- Docker
- Posséder un compte Scalingo et avois accès aux applications FCU
- Récupérer le fichier `.env.local` auprès d'un membre de l'équipe

### Site local

- Installer les dépendances
```sh
pnpm i
```

- Déposer le fichier `.env.local` à la racine du projet.

- Lancer les conteneurs Docker (services annexes + app next).
```sh
docker compose up -d
```

- Installer la [CLI Scalingo](https://doc.scalingo.com/platform/cli/start) puis s'authentifier (servira à voir les logs et créer des tunnels vers les bases de données prod et dev)
```sh
scalingo login
```

- Préparer la structure de la BDD
```sh
pnpm db:migrate
```

- Peupler la base de données locale à partir de la base de production, notamment les tables de référence et calculées.
```sh
pnpm db:bootstrap
```

- Si jamais l'étape de bootstrap est trop lente, essayer de récupérer un dump depuis le dashboard Scalingo et l'importer en local (~ 20-30 minutes)
```sh
tar -xzvf 20240XXXXXXXXXX_france_chal_3098.tar.gz
pg_restore --clean --if-exists --no-owner --no-privileges --verbose --no-comments --dbname postgres://postgres:postgres_fcu@localhost:5432/postgres 20240XXXXXXXXXX_france_chal_3098.pgsql
```

- Désormais, sont accessibles :
  - Le site internet : http://localhost:3000/
  - L'interface mailpit pour les emails : http://localhost:8025/
  - La base de données PostgreSQL : localhost:5432

### Airtable

Une partie des données est stockées dans [Airtable](https://airtable.com/), l'email/mot de passe est partagé, à récupérer auprès d'un membre de l'équipe.

1. Copier la base de données `FCU Prod` vers `FCU Dev <ton prenom>` (Cocher uniquement `Duplicate records`)
2. Récupérer les API Keys et les modifier dans le fichier `.env.local`

## Développement avec Publicodes

Les commandes ci-dessous sont à réaliser une fois pour lier la dépendance [@betagouv/france-chaleur-urbaine-publicodes](https://github.com/betagouv/france-chaleur-urbaine-publicodes) directement au répertoire local `france-chaleur-urbaine-publicodes` pour faciliter le développement sans avoir besoin de publier une version sur le registre NPM.

```sh
# rend disponible le paquet @betagouv/france-chaleur-urbaine-publicodes globalement en local
(cd france-chaleur-urbaine-publicodes && pnpm link)

# utilise le paquet local @betagouv/france-chaleur-urbaine-publicodes plutôt que celui du registre
(cd france-chaleur-urbaine && pnpm link @betagouv/france-chaleur-urbaine-publicodes)
```

Note : Le lien créé est un lien symbolique, il ne fonctionne pas quand le serveur est lancé dans un conteneur Docker.
Il faut donc lancer le serveur en dehors du conteneur Docker.

```sh
# arrêter le conteneur du serveur
docker compose stop web
# corriger les permissions (root dans le conteneur != de l'utilisateur local)
sudo chown -R $USER: .next node_modules
# lancer le serveur
pnpm dev
```

<!-- Source: /CLAUDE.md -->

## Essential Commands

```bash
# Development
pnpm dev                   # Start dev server (port 3000)
pnpm dev:email             # Email template development

# Code Quality (ALWAYS run before committing)
pnpm lint                  # ESLint check
pnpm lint:fix              # Fix linting issues
pnpm prettier-check        # Code formatting
pnpm lint:file             # Lint specific file
pnpm ts                    # Run typescript on all codebase

# Build
pnpm build                 # Production build
pnpm build:analyze         # Analyze bundle size

# Images
pnpm cli optimize images  # Optimize all images in public/ directory
```

## Lint

- [Biome](https://biomejs.dev/fr/) est utilisé comme formatteur de code et linter.

```sh
pnpm lint
```

## Build

```sh
pnpm build
```

## Important Notes

- **Node.js 20** and **pnpm 8** are required
- Path aliases configured: `@/` → `src/`, `@cli/` → `scripts/`
- French government design system (DSFR) must be used for UI
- All geographic data uses PostGIS and Turf.js for calculations
- Authentication uses custom session management (see `src/modules/auth/server/service.ts`)
- Environment variables documented in `.env.example`

