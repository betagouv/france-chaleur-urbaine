# Développement

## API

Un schéma OpenAPI a été initialisé manuellement en yaml à partir du [Swagger Editor](https://editor-next.swagger.io/), et est référencé depuis la [plateforme data.gouv.fr](https://www.data.gouv.fr/fr/dataservices/api-france-chaleur-urbaine/).
Il se trouve dans `public/openapi-schema.yaml`.

Voici les routes publiques qui y sont présentes :
- GET /api/v1/eligibility : tester l'éligibilité d'un point géographique
- GET /api/v1/networks : télécharger les réseaux de chaleur


## Intégration bibliothèque DSFR

L'intégration du DSFR ne semble pas complète et certaines icônes sont introuvables, notamment les checkbox des tags.

```sh
mkdir -p public/icons/system
cp -a node_modules/@gouvfr/dsfr/dist/icons/system/checkbox-circle-line.svg public/icons/system/checkbox-circle-line.svg
```

## Utilitaires de manipulation géographique

Afin de pouvoir lancer les commandes de manipulation de fichier géographiques, nous avons besoin de `ogr2ogr` qui est fourni par [GDAL](https://gdal.org/en/stable/download.html) et de [tippecanoe](https://github.com/mapbox/tippecanoe).

```sh
docker pull ghcr.io/osgeo/gdal:alpine-normal-latest-amd64
# ou
docker pull ghcr.io/osgeo/gdal:alpine-normal-latest-arm64

docker pull naxgrp/tippecanoe
```

## Ajout d'utilisateurs de test

Pour créer des utilisateurs de chaque rôle :
```sh
pnpm cli users:add admin@fcu.local 'MON MDP SECURE' admin
pnpm cli users:add professionnel@fcu.local 'MON MDP SECURE' professionnel
pnpm cli users:add particulier@fcu.local 'MON MDP SECURE' particulier
pnpm cli users:add gestionnaire@fcu.local 'MON MDP SECURE' gestionnaire ENGIE_2407C,ENGIE_2305C,ENGIE_7615C,ENGIE_6105C
```


## Pipedrive

La connexion est utilisée pour le moment pour récupérer les nombres d'iframes qui est utilisé dans les statistiques.

Un token a été généré sur https://francechaleururbaine.pipedrive.com/settings/api et doit être défini par la variable d'environnement `PIPEDRIVE_API_KEY`.


## Configuration des notifications de déploiement Scalingo dans Mattermost

- Dans Mattermost, aller dans Menu principal (en haut à gauche) > Intégrations > Webhooks entrants.
- Créer un webhook entrant avec ces informations:
  - Titre : FCU Notifications déploiement Scalingo
  - Canal : [France Chaleur Urbaine] Notifications
  - Verrouiller le canal : oui
  - Utilisateur : scalingo
  - Photo de profil : https://avatars.githubusercontent.com/u/4868969

- Sur Scalingo, créer un nouveau notifier sur https://dashboard.scalingo.com/apps/osc-fr1/france-chaleur-urbaine/settings/notifiers/ :
  - Name : Notification déploiement Mattermost
  - URL of the webhook : https://mattermost.incubateur.net/hooks/zsw9wcg5at8r98f9o8c9fe4imr (le lien obtenu à l'étape précédente)
  - Events : sélectionner tous


## Buildpack Scalingo

Un buildpack custom Scalingo est nécessaire pour pouvoir utiliser `ogr2ogr` et `tippecanoe` sur Scalingo. Ces outils géographiques nécessitent des bibliothèques système spécifiques qui ne sont pas disponibles par défaut.

Configuré via le fichier .buildpacks :
- https://github.com/Scalingo/apt-buildpack.git : permet d'installer des paquets Apt, dans notre cas gdal et ses bibliothèques
- https://github.com/betagouv/france-chaleur-urbaine-scalingo-buildpack.git : notre buildpack qui permet de compiler et rendre disponible le binaire tippecanoe [source](https://github.com/betagouv/france-chaleur-urbaine-scalingo-buildpack)
- https://github.com/Scalingo/nodejs-buildpack.git : contient l'environnement Node

Aussi, il est nécessaire de configurer les variables d'environnement suivantes sur Scalingo afin que les commandes ogr2ogr trouvent la lib `libblas.so` (voir doc Scalingo [Deploy an Application Including the GDAL Library](https://doc.scalingo.com/platform/app/app-with-gdal)) :
```sh
LD_LIBRARY_PATH=/app/.apt/usr/lib/x86_64-linux-gnu/blas/:/app/.apt/usr/lib/x86_64-linux-gnu/lapack/
PROJ_LIB=/app/.apt/usr/share/proj
```
