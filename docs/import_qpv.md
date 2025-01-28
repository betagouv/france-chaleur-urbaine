# Potentiels de raccordement par territoire

Données récupérés depuis le [ticket trello](https://trello.com/c/VaOCHF4j/1421-ajouter-couche-qpv)

## QPV 2015 ANRU

Prérequis : posséder QP_METROPOLE_LB93.shp + autres fichiers

```sh

ogr2ogr -f "GeoJSON" QP_METROPOLE_LB93_4326.geojson QP_METROPOLE_LB93.shp -t_srs EPSG:4326

# transformation des données pour correspondre au format 2024
jq '
  .features[] |= (
    .properties = {
      code_quartier: .properties.CODE_QP,
      nom_quartier: .properties.NOM_QP,
      is2015: true
    }
  )
' QP_METROPOLE_LB93_4326.geojson | docker run -i --rm --entrypoint /bin/bash naxgrp/tippecanoe -c "tippecanoe-json-tool" | docker run -i --rm -v $PWD:/volume -w /volume --user $(id -u):$(id -g) --entrypoint /bin/bash naxgrp/tippecanoe -c "tippecanoe -e quartiers_prioritaires_politique_ville_2015_anru_tiles --read-parallel --layer=layer --force --generate-ids --minimum-zoom=5 --maximum-zoom=14"

yarn cli import-mvt-directory quartiers_prioritaires_politique_ville_2015_anru_tiles quartiers_prioritaires_politique_ville_2015_anru_tiles

./scripts/copyLocalTableToRemote.sh dev quartiers_prioritaires_politique_ville_2015_anru_tiles
```

## QPV 2024

Prérequis : posséder qp-2024-epsg2154-20240820.geojson

```sh
ogr2ogr -f "GeoJSON" qp-2024-epsg2154-20240820_4326.geojson qp-2024-epsg2154-20240820.geojson -t_srs EPSG:4326

cat qp-2024-epsg2154-20240820_4326.geojson | docker run -i --rm --entrypoint /bin/bash naxgrp/tippecanoe -c "tippecanoe-json-tool" | docker run -i --rm -v $PWD:/volume -w /volume --user $(id -u):$(id -g) --entrypoint /bin/bash naxgrp/tippecanoe -c "tippecanoe -e quartiers_prioritaires_politique_ville_2024_tiles --read-parallel --layer=layer --force --generate-ids --minimum-zoom=5 --maximum-zoom=14"

yarn cli import-mvt-directory quartiers_prioritaires_politique_ville_2024_tiles quartiers_prioritaires_politique_ville_2024_tiles

./scripts/copyLocalTableToRemote.sh dev quartiers_prioritaires_politique_ville_2024_tiles
```
