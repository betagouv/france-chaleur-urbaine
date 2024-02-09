# Développement

## API

Un schéma OpenAPI a été initialisé manuellement en yaml à partir du [Swagger Editor](https://editor-next.swagger.io/), et sera référencé depuis l'[Annuaire des API](https://api.gouv.fr/).
Il se trouve dans `public/openapi-schema.yaml`.

Voici les routes publiques qui y sont présentes :
- GET /api/v1/eligibility : tester l'éligibilité d'un point géographique
- GET /api/v1/networks : télécharger les réseaux de chaleur
