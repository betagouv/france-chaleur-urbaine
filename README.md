# France Chaleur Urbaine

> Le site officiel de france-chaleur-urbaine.beta.gouv.fr

Ce dépôt regroupe le code relatif au site france-chaleur-urbaine.beta.gouv.fr.

Il utilise, entre autre, [Docker](https://www.docker.com), [React](https://reactjs.org), [Next.js](https://nextjs.org), [PostgreSQL](https://www.postgresql.org/) et [MapLibre](https://maplibre.org).

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

- Démarrer le serveur web
```sh
pnpm dev
```

- Si besoin, démarrer le service clock (crons et traitement des jobs)
```sh
pnpm clock:start
```

- Désormais, sont accessibles :
  - Le site internet : http://localhost:3000/
  - L'interface mailpit pour les emails : http://localhost:8025/
  - La base de données PostgreSQL : localhost:5432

### Airtable

Une partie des données est stockées dans [Airtable](https://airtable.com/), l'email/mot de passe est partagé, à récupérer auprès d'un membre de l'équipe.

1. Copier la base de données `FCU Prod` vers `FCU Dev <ton prenom>` (Cocher uniquement `Duplicate records`)
2. Récupérer les API Keys et les modifier dans le fichier `.env.local`

### Kysely

Certaines requêtes à la base de données sont générées par [Kysely](https://github.com/koskimas/kysely) à partir du [fichier `src/server/db/kysely/database.ts`](src/server/db/kysely/database.ts).
Celui-ci doit être généré à partir de la base de données à chaque fois que celle-ci est modifiée.

- `pnpm db:verify` pour voir si des modifications ont été faites à la base de données sans avoir été incluses dans le fichier `src/db/kysely/database.ts`
- `pnpm db:sync` pour générer le fichier `src/db/kysely/database.ts` à partir de la base de données

## Développement avec Publicodes

La procédure ci-dessous permet de travailler avec le dépôt local [@betagouv/france-chaleur-urbaine-publicodes](https://github.com/betagouv/france-chaleur-urbaine-publicodes) sans avoir besoin de publier une version sur le registre NPM.

Le package est installé depuis une archive générée localement, et **non** via un lien — voir [Pourquoi une archive et pas un lien ?](#pourquoi-une-archive-et-pas-un-lien-) plus bas.

```sh
# recompile publicodes, génère l'archive et l'installe — à relancer après chaque modification des règles
pnpm publicodes:local
# attention, il faut garder cette modification en local, ne pas commit les changements du package.json et pnpm-lock.yaml

# pour revenir à la version d'origine
pnpm publicodes:reset
```

Le dépôt publicodes doit être cloné à côté de celui-ci, dans `../france-chaleur-urbaine-publicodes` : ce chemin est codé en dur dans les deux commandes.

### Pourquoi une archive et pas un lien ?

Le package ne doit pas être installé via un lien (`pnpm link`, ou `@link:../france-chaleur-urbaine-publicodes`) : Turbopack refuse de résoudre un module dont le chemin réel est en dehors du projet.

- au build, la résolution échoue avec `Module not found` sur les deux imports de valeur du package ;
- élargir la racine de Turbopack au répertoire parent (`turbopack.root`) corrige le build, mais rend le serveur de dev inutilisable : la mémoire grimpe de plusieurs Go en quelques secondes et la page n'est jamais rendue. En dev, Turbopack surveille toute sa racine, qui contient alors les dépôts voisins.

L'archive est extraite dans `node_modules`, donc à l'intérieur du projet, et la racine par défaut suffit.


## Lint

- [Biome](https://biomejs.dev/fr/) est utilisé comme formatteur de code et linter.

```sh
pnpm lint
```


## Tests

[Vitest](https://vitest.dev/) est le framework utilisé pour les tests unitaires.

```sh
pnpm test
```

[Playwright](https://playwright.dev/) + [axe-core](https://github.com/dequelabs/axe-core) sont utilisés pour les tests d'accessibilité automatisés (WCAG 2.1 AA).

```sh
pnpm test:a11y          # lancer les tests (serveur dev requis sur localhost:3000)
pnpm test:a11y:report   # ouvrir le rapport HTML
```


## Build

```sh
pnpm build
```


## Hook pre-commit

Un hook pre-commit Git permet de vérifier que le code est correctement linté avec [lint-staged](https://github.com/lint-staged/lint-staged), et [talisman](https://github.com/thoughtworks/talisman/) est un outil qui permet de détecter les fuites de secrets dans les commits.
À noter que [GitGuardian](https://www.gitguardian.com/) est configuré sur l'organisation beta.gouv et fait la même chose, mais le secret a alors été rendu public et il faut alors l'invalider.


Si talisman détecte une erreur au moment d'un commit, 2 options sont possibles :
- soit corriger l'erreur pour supprimer l'alerte ;
- soit ajouter une exception via la commande `pnpm talisman:add-exception`.


<!-- Architecture and deployment information lives in .ai/context/ (architecture.md, deployment.md, etc.) -->


# Licence

Le code de ce logiciel est soumis à la licence [Etalab 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
