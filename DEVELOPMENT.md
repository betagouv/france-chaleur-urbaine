# Développement

## API

Un schéma OpenAPI a été initialisé manuellement en yaml à partir du [Swagger Editor](https://editor-next.swagger.io/), et sera référencé depuis l'[Annuaire des API](https://api.gouv.fr/).
Il se trouve dans `public/openapi-schema.yaml`.

Voici les routes publiques qui y sont présentes :
- GET /api/v2/eligibility : tester l'éligibilité d'un point géographique
- GET /api/v1/networks : télécharger les réseaux de chaleur


## Intégration bibliothèque DSFR

L'intégration du DSFR ne semble pas complète et certaines icônes sont introuvables, notamment les checkbox des tags.

```sh
mkdir -p public/icons/system
cp -a node_modules/@gouvfr/dsfr/dist/icons/system/checkbox-circle-line.svg public/icons/system/checkbox-circle-line.svg
```
