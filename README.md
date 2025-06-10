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
pnpm i
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
DATABASE_URL="postgres://postgres:postgres_fcu@localhost:5432/postgres" pnpm db:migrate
```

- Désormais, sont accessibles :
  - Le site internet : http://localhost:3000/
  - L'interface maildev pour les emails : http://localhost:1080/
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

- [Prettier](https://prettier.io/) est utilisé comme formatteur de code.
- [ESLint](https://eslint.org/) est utilisé pour détecter les erreurs de programmation.

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


## Architecture de déploiement et outils

Le site de France Chaleur Urbaine est hébergé chez Scalingo, sous le compte du MTE (tristan-robert).
2 applications sont créées et branchées aux branches *main* et *dev* du dépôt [GitHub](https://github.com/betagouv/france-chaleur-urbaine).

Chaque application contient :
- un conteneur Next.js pour l'application web
- un conteneur clock qui est utilisé pour faire tourner des tâches récurrentes et de synchronisation
- une BDD PostgreSQL


```mermaid
graph LR;
N("Next.js (Scalingo)")-->BDD("PostgreSQL (Scalingo)");
N-->A("Airtable (SaaS)");
N-->B("SMTP Brevo (SaaS)");
N-->M("Matomo (stats.beta.gouv.fr)");
N-->S("Sentry (sentry.beta.gouv.fr)");
```

Particularité de l'environnement de dev :
- Des review apps Scalingo sont utilisées pour créer des environnements à partir des pull requests GitHub.
- Les emails sont branchés sur smtp.ethereal.email
- Utilise la base Airtable de production


En local, Docker est utilisé pour 2 conteneurs :
- Postgres pour la BDD
- Mailpit est utilisé comme serveur SMTP et interface de visualisation des emails.
L'application se lance sans conteneur, pour éviter les problèmes de droits avec les volumes mappés et ne pas casser les chemins entre le code et l'IDE quand des stack traces apparaissent

FCU intègre plusieurs outils d'analyse d'audience :
- Matomo
- HotJar, utilisé notamment pour des sondages
- Google Analytics
- LinkedIn (obsolète)
- Facebook (obsolète)

GitHub contient 2 dépôts :
- https://github.com/betagouv/france-chaleur-urbaine : pour tout le code de l'application
- https://github.com/betagouv/france-chaleur-urbaine-publicodes : pour les règles du comparateur de modes de chauffage

Les règles publicodes sont publiées sur le registre [NPM](https://www.npmjs.com/package/@betagouv/france-chaleur-urbaine-publicodes) et utilisé comme dépendance par le projet principal. L'URL GitHub pages (https://betagouv.github.io/france-chaleur-urbaine-publicodes/) est également utilisée par le projet pour expliquer les règles en détail.


### Outils

- Un compte gmail est partagé pour l'équipe (france.chaleur.urbaine@gmail.com) et est souvent utilisé pour créer des comptes dans d'autres applications
- [Trello](https://trello.com) est utilisé pour les kanbans des features à développer sur le site et aussi less intégrations des tracés sur la carte
- [Airtable](https://airtable.com/) est utilisé pour enregistrer tout un tas de données, mais seulement pour l'application FCU
- [GitBook](https://www.gitbook.com/) est connecté au dépôt GitHub pour intégrer les actualités de FCU.
- [Alwaysdata](https://www.alwaysdata.com/) est utilisé pour gérer les zones DNS suivantes :
  - france-chaleur-urbaine.beta.gouv.fr (prod)
  - france-chaleur-urbaine.incubateur.net (dev)
- Le [VaultWarden Beta](https://vaultwarden.incubateur.net/) est utilisé pour centraliser les mots de passe des comptes (mais pas complètement encore !)
- Le [Mattermost Beta](http://mattermost.incubateur.net/) est utilisé pour échanger avec l'équipe avec ses différents canaux : Bizdev, Dev / UX, Team, Notifications (ce dernier est utilisé par Scalingo pour )
- [Jitsi Meet](https://meet.liiib.re/) est utilisé pour faire des points en visio
- [Figma](figma.com) est utilisé pour les maquettes
- [Pipedrive](https://www.pipedrive.com/) est utilisé par les bizdev pour gérer les relations avec les prospects et les usagers
- [Brevo](https://brevo.com/) est utilisé pour les emails transactionnels de FCU mais aussi les campagnes marketing.


# Licence

Le code de ce logiciel est soumis à la licence [Etalab 2.0](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).
