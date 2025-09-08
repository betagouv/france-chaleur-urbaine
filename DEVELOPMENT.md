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
