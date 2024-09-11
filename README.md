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
DATABASE_URL="postgres://postgres:postgres_fcu@localhost:5432/postgres" yarn db:migrate
```

- Désormais, sont accessibles :
  - Le site internet : http://localhost:3000/
  - L'interface maildev pour les emails : http://localhost:1080/
  - La base de données PostgreSQL : localhost:5432

### Airtable

Une partie des données est stockées dans [Airtable](https://airtable.com/), l'email/mot de passe est partagé, à récupérer auprès d'un membre de l'équipe.

1. Copier la base de données `FCU Prod` vers `FCU Dev <ton prenom>` (Cocher uniquement `Duplicate records`)
2. Récupérer les API Keys et les modifier dans le fichier `.env.local`


## Développement avec Publicodes

Les commandes ci-dessous sont à réaliser une fois pour lier la dépendance [@betagouv/france-chaleur-urbaine-publicodes](https://github.com/betagouv/france-chaleur-urbaine-publicodes) directement au répertoire local `france-chaleur-urbaine-publicodes` pour faciliter le développement sans avoir besoin de publier une version sur le registre NPM.

```sh
# rend disponible le paquet @betagouv/france-chaleur-urbaine-publicodes globalement en local
(cd france-chaleur-urbaine-publicodes && yarn link)

# utilise le paquet local @betagouv/france-chaleur-urbaine-publicodes plutôt que celui du registre
(cd france-chaleur-urbaine && yarn link @betagouv/france-chaleur-urbaine-publicodes)
```

Note : Le lien créé est un lien symbolique, il ne fonctionne pas quand le serveur est lancé dans un conteneur Docker.
Il faut donc lancer le serveur en dehors du conteneur Docker.

```sh
# arrêter le conteneur du serveur
docker compose stop web
# corriger les permissions (root dans le conteneur != de l'utilisateur local)
sudo chown -R $USER: .next node_modules
# lancer le serveur
yarn dev
```


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


## Hook pre-commit

Un hook pre-commit Git permet de vérifier que le code est correctement linté avec [lint-staged](https://github.com/lint-staged/lint-staged), et [talisman](https://github.com/thoughtworks/talisman/) est un outil qui permet de détecter les fuites de secrets dans les commits.
À noter que [GitGuardian](https://www.gitguardian.com/) est configuré sur l'organisation beta.gouv et fait la même chose, mais le secret a alors été rendu public et il faut alors l'invalider.


Si talisman détecte une erreur au moment d'un commit, 2 options sont possibles :
- soit corriger l'erreur pour supprimer l'alerte ;
- soit ajouter une exception via la commande `yarn talisman:add-exception`.


# Licence

Le code de ce logiciel est soumis à la licence [Etalab 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
