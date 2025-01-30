# Génération des tuiles des réseaux de chaleur

Processus légèrement différent du tiles:fill classique étant donné qu'on a besoin de précalculer certaines données.

```sh
# générer un fichier geojson depuis la table reseaux_de_chaleur
yarn cli tiles:generate-geojson reseaux-de-chaleur --file reseaux_de_chaleur.geojson

# générer les tuiles à partir du fichier geojson
yarn cli tiles:import-geojson reseaux_de_chaleur.geojson reseaux_de_chaleur_tiles 0 14

# synchronisation avec la BDD de dev ou prod
./scripts/copyLocalTableToRemote.sh dev reseaux_de_chaleur_tiles --data-only
# ./scripts/copyLocalTableToRemote.sh prod reseaux_de_chaleur_tiles --data-only
```
