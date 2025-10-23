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


<!-- Architecture and deployment information has been moved to .ai/context/ARCHITECTURE.md -->


# Licence

Le code de ce logiciel est soumis à la licence [Etalab 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
