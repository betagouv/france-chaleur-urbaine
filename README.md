# France Chaleur Urbaine

> Le site officiel de france-chaleur-urbaine.beta.gouv.fr

Ce dépôt regroupe le code relatif au site france-chaleur-urbaine.beta.gouv.fr.

Il utilise, entre autre, [Docker](https://www.docker.com), [React](https://reactjs.org), [Next.js](https://nextjs.org), [PostgreSQL](https://www.postgresql.org/) et [MapLibre](https://maplibre.org).

## Installation de l'environnement de développement

Pré-requis :
- Node.js version 20
- Yarn
- Docker
- Récupérer le dump des tables de référence auprès d'un membre de l'équipe ou depuis le dashboard Scalingo
- Récupérer le fichier `.env.local` auprès d'un membre de l'équipe

### Site local

- Installer les dépendances
```sh
yarn
```

- Déposer le fichier `.env.local` à la racine du projet.

- Lancer les conteneurs Docker (services annexes + app next).
```sh
docker compose up -d
```

- Importer le fichier dans la BDD (~ 20-30 minutes)

Si le fichier a été récupéré depuis le dashboard Scalingo, il faut le décompresser avant de l'importer.
```sh
tar -xzvf 20240XXXXXXXXXX_france_chal_3098.tar.gz
```

puis

```sh
pg_restore --clean --if-exists --no-owner --no-privileges --verbose --no-comments --dbname postgres://postgres:postgres_fcu@localhost:5432/postgres 20240XXXXXXXXXX_france_chal_3098.pgsql
```

- Appliquer les migrations de la BDD.
```sh
DATABASE_URL="postgres://postgres:dummy@localhost:5432/postgres" yarn db:migrate
```

- Désormais, sont accessibles :
  - Le site internet : http://localhost:3000/
  - L'interface maildev pour les emails : http://localhost:1080/
  - La base de données PostgreSQL : localhost:5432

### Airtable

Une partie des données est stockées dans [Airtable](https://airtable.com/), l'email/mot de passe est partagé, à récupérer auprès d'un membre de l'équipe.

1. Copier la base de données `FCU Prod` vers `FCU Dev <ton prenom>` (Cocher uniquement `Duplicate records`)
2. Récupérer les API Keys et les modifier dans le fichier `.env.local`


## Lint

- [Prettier](https://prettier.io/) est utilisé comme formatteur de code.
- [ESLint](https://eslint.org/) est utilisé pour détecter les erreurs de programmation.

```sh
yarn lint
```


## Tests

[Vitest](https://vitest.dev/) est le framework utilisé pour les tests unitaires.

```sh
yarn test
```


## Build

```sh
yarn build
```

Note : Il se peut qu'un problème de permissions survienne sur le dossier .next qui est monté dans le conteneur Docker.
Dans ce cas, la commande `sudo chown -R $USER: .next` corrige le problème.


# Licence

Le code de ce logiciel est soumis à la licence [Etalab 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
