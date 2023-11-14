# France Chaleur Urbaine

> Le site officiel de france-chaleur-urbaine.beta.gouv.fr

Ce dépôt regroupe le code relatif au site france-chaleur-urbaine.beta.gouv.fr.

Il utilise, entre autre, [Docker](https://www.docker.com), [React](https://reactjs.org), [Next.js](https://nextjs.org), [PostgreSQL](https://www.postgresql.org/) et [MapLibre](https://maplibre.org).

## Installation de l'environnement de développement

Pré-requis :
- Node.js version 20
- Yarn
- Docker
- Récupérer le dump des tables de référence auprès d'un membre de l'équipe
- Récupérer le fichier `.env.local` auprès d'un membre de l'équipe

- Installer les dépendances
```sh
yarn
```

- Déposer le fichier `.env.local` à la racine du projet.

- Lancer les conteneurs Docker (services annexes + app next).
```sh
docker compose up -d
```

- Appliquer les migrations de la BDD.
```sh
DATABASE_URL="postgres://postgres:postgres_fcu@localhost:5432/postgres" yarn db:migrate
```

- Importer le fichier `dump.sql` dans la BDD (~ 20-30 minutes)
```sh
pg_restore --clean --if-exists --no-owner --no-privileges --no-comments --dbname postgres://postgres:postgres_fcu@localhost:5432/postgres dump.sql
```

- Désormais, sont accessibles :
  - Le site internet : http://localhost:3000/
  - L'interface maildev pour les emails : http://localhost:1080/
  - La base de données PostgreSQL : localhost:5432

# Licence

Le code de ce logiciel est soumis à la licence [Etalab 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
