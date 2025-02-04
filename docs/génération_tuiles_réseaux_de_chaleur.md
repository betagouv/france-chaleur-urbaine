# Génération des tuiles des réseaux de chaleur

Processus légèrement différent du tiles:fill classique étant donné qu'on a besoin de précalculer certaines données.

```sh
# OPTION 1
yarn cli tiles:generate reseaux-de-chaleur 0 14

# OPTION 2 (en découpant l'option 1)
# générer un fichier geojson depuis la table reseaux_de_chaleur
yarn cli tiles:generate-geojson reseaux-de-chaleur --file reseaux_de_chaleur.geojson

# générer les tuiles à partir du fichier geojson
yarn cli tiles:import-geojson-legacy reseaux_de_chaleur.geojson reseaux_de_chaleur_tiles 0 14

# Enfin, synchronisation avec la BDD de dev ou prod
./scripts/copyLocalTableToRemote.sh dev reseaux_de_chaleur_tiles --data-only
# ./scripts/copyLocalTableToRemote.sh prod reseaux_de_chaleur_tiles --data-only
```
