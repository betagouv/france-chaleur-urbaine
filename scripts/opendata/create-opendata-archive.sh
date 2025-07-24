#!/bin/bash -e

# Ce script permet de générer l'archive opendata avec toutes les données de France Chaleur Urbaine.
# Cette archive est à envoyer à Florence pour compléter et sera déposée sur data.gouv.fr
#
# https://www.data.gouv.fr/fr/datasets/traces-des-reseaux-de-chaleur-et-de-froid/

opendata_dir=$(mktemp -d)

echo "Utilisation du répertoire temporaire $opendata_dir"

# Detect OS and set LOCALHOST accordingly
if [[ "$OSTYPE" == "darwin"* ]]; then
  DOCKER_HOST="host.docker.internal"
  GDAL_IMAGE="ghcr.io/osgeo/gdal:alpine-normal-latest-arm64"
else
  DOCKER_HOST="localhost"
  GDAL_IMAGE="ghcr.io/osgeo/gdal:alpine-normal-latest-amd64"
fi

psql="docker run -i --rm --network host postgis/postgis:16-3.5-alpine psql"

ogr2ogr() {
  docker run -i --rm --network host -v "$opendata_dir":/output "$GDAL_IMAGE" ogr2ogr "$@"
}

# Création des vues
# Les vues préparent les champs qu'on veut exporter en GeoJSON/Shapefile et type bien les champs pour que le format Shapefile soit correct.
# On ne fait pas de requête directement car postgres ne permet pas d'appeler des fonction avec + de 100 paramètres (par exemple pour `json_build_object`).
# Pour les exports Shapefile des réseaux de chaleur et de froid, on utilise des tables avec des champs texte pour autoriser les valeurs vides dans le fichier dbf
$psql postgres://postgres:postgres_fcu@$DOCKER_HOST:5432/postgres <<EOF
  drop schema if exists opendata cascade;
  create schema if not exists opendata;

  drop view if exists opendata.reseaux_de_chaleur;
  create view opendata.reseaux_de_chaleur as (
    SELECT
      "geom",

      -- champs exportés en propriétés
      "Identifiant reseau",
      nom_reseau,
      array_to_string("communes", ',') as "communes",
      departement,
      region,
      "MO",
      "Gestionnaire",
      "reseaux classes",
      annee_creation::integer,
      longueur_reseau::numeric(10, 1),
      nb_pdl::integer,
      "Taux EnR&R"::numeric(10, 1),
      "contenu CO2"::numeric(10, 3),
      "contenu CO2 ACV"::numeric(10, 3),
      "PM"::numeric(10, 2),
      "PV%"::integer,
      "PF%"::integer,
      "PM_L"::numeric(10, 2),
      "PM_T"::numeric(10, 2),
      "Rend%"::integer,
      "Dev_reseau%"::integer,
      "production_totale_MWh"::integer,
      "prod_MWh_gaz_naturel"::integer,
      "prod_MWh_charbon"::integer,
      "prod_MWh_fioul_domestique"::integer,
      "prod_MWh_fioul_lourd"::integer,
      "prod_MWh_GPL"::integer,
      "prod_MWh_biomasse_solide"::integer,
      "prod_MWh_dechets_internes"::integer,
      "prod_MWh_UIOM"::integer,
      "prod_MWh_biogaz"::integer,
      "prod_MWh_geothermie"::integer,
      "prod_MWh_PAC"::integer,
      "prod_MWh_solaire_thermique"::integer,
      "prod_MWh_autres_ENR"::integer,
      "prod_MWh_chaleur_industiel"::integer,
      "prod_MWh_autre_chaleur_recuperee"::integer,
      "prod_MWh_chaudieres_electriques"::integer,
      "prod_MWh_autres"::integer,
      "puissance_totale_MW"::numeric(10, 2),
      "puissance_MW_gaz_naturel"::numeric(10, 2),
      "puissance_MW_charbon"::numeric(10, 2),
      "puissance_MW_fioul_domestique"::numeric(10, 2),
      "puissance_MW_fioul_lourd"::numeric(10, 2),
      "puissance_MW_GPL"::numeric(10, 2),
      "puissance_MW_biomasse_solide"::numeric(10, 2),
      "puissance_MW_dechets_internes"::numeric(10, 2),
      "puissance_MW_UIOM"::numeric(10, 2),
      "puissance_MW_biogaz"::numeric(10, 2),
      "puissance_MW_geothermie"::numeric(10, 2),
      "puissance_MW_PAC"::numeric(10, 2),
      "puissance_MW_solaire_thermique"::numeric(10, 2),
      "puissance_MW_autres_ENR"::numeric(10, 2),
      "puissance_MW_chaleur_industiel"::numeric(10, 2),
      "puissance_MW_autre_chaleur_recuperee"::numeric(10, 2),
      "puissance_MW_chaudieres_electriques"::numeric(10, 2),
      "puissance_MW_autres"::numeric(10, 2),
      "livraisons_totale_MWh"::integer,
      "livraisons_residentiel_MWh"::integer,
      "livraisons_tertiaire_MWh"::integer,
      "livraisons_industrie_MWh"::integer,
      "livraisons_agriculture_MWh"::integer,
      "livraisons_autre_MWh"::integer,
      eau_chaude,
      eau_surchauffee,
      vapeur
    FROM reseaux_de_chaleur
    order by "Identifiant reseau", id_fcu
  );

  drop view if exists opendata.reseaux_de_chaleur_shp;
  create view opendata.reseaux_de_chaleur_shp as (
    SELECT
      "geom",

      -- champs exportés en propriétés
      "Identifiant reseau",
      nom_reseau,
      array_to_string("communes", ',') as "communes",
      departement,
      region,
      "MO",
      "Gestionnaire",
      "reseaux classes",
      annee_creation::integer::text,
      longueur_reseau::numeric(10, 1)::text,
      nb_pdl::integer::text,
      "Taux EnR&R"::numeric(10, 1)::text,
      "contenu CO2"::numeric(10, 3)::text,
      "contenu CO2 ACV"::numeric(10, 3)::text,
      "PM"::numeric(10, 2)::text,
      "PV%"::integer::text,
      "PF%"::integer::text,
      "PM_L"::numeric(10, 2)::text,
      "PM_T"::numeric(10, 2)::text,
      "Rend%"::integer::text,
      "Dev_reseau%"::integer::text,
      "production_totale_MWh"::integer::text,
      "prod_MWh_gaz_naturel"::integer::text,
      "prod_MWh_charbon"::integer::text,
      "prod_MWh_fioul_domestique"::integer::text,
      "prod_MWh_fioul_lourd"::integer::text,
      "prod_MWh_GPL"::integer::text,
      "prod_MWh_biomasse_solide"::integer::text,
      "prod_MWh_dechets_internes"::integer::text,
      "prod_MWh_UIOM"::integer::text,
      "prod_MWh_biogaz"::integer::text,
      "prod_MWh_geothermie"::integer::text,
      "prod_MWh_PAC"::integer::text,
      "prod_MWh_solaire_thermique"::integer::text,
      "prod_MWh_autres_ENR"::integer::text,
      "prod_MWh_chaleur_industiel"::integer::text,
      "prod_MWh_autre_chaleur_recuperee"::integer::text,
      "prod_MWh_chaudieres_electriques"::integer::text,
      "prod_MWh_autres"::integer::text,
      "puissance_totale_MW"::numeric(10, 2)::text,
      "puissance_MW_gaz_naturel"::numeric(10, 2)::text,
      "puissance_MW_charbon"::numeric(10, 2)::text,
      "puissance_MW_fioul_domestique"::numeric(10, 2)::text,
      "puissance_MW_fioul_lourd"::numeric(10, 2)::text,
      "puissance_MW_GPL"::numeric(10, 2)::text,
      "puissance_MW_biomasse_solide"::numeric(10, 2)::text,
      "puissance_MW_dechets_internes"::numeric(10, 2)::text,
      "puissance_MW_UIOM"::numeric(10, 2)::text,
      "puissance_MW_biogaz"::numeric(10, 2)::text,
      "puissance_MW_geothermie"::numeric(10, 2)::text,
      "puissance_MW_PAC"::numeric(10, 2)::text,
      "puissance_MW_solaire_thermique"::numeric(10, 2)::text,
      "puissance_MW_autres_ENR"::numeric(10, 2)::text,
      "puissance_MW_chaleur_industiel"::numeric(10, 2)::text,
      "puissance_MW_autre_chaleur_recuperee"::numeric(10, 2)::text,
      "puissance_MW_chaudieres_electriques"::numeric(10, 2)::text,
      "puissance_MW_autres"::numeric(10, 2)::text,
      "livraisons_totale_MWh"::integer::text,
      "livraisons_residentiel_MWh"::integer::text,
      "livraisons_tertiaire_MWh"::integer::text,
      "livraisons_industrie_MWh"::integer::text,
      "livraisons_agriculture_MWh"::integer::text,
      "livraisons_autre_MWh"::integer::text,
      eau_chaude,
      eau_surchauffee,
      vapeur
    FROM reseaux_de_chaleur
    order by "Identifiant reseau", id_fcu
  );

  drop view if exists opendata.reseaux_de_froid;
  create view opendata.reseaux_de_froid as (
    SELECT
      "geom",

      -- champs exportés en propriétés
      "Identifiant reseau",
      nom_reseau,
      array_to_string("communes", ',') as "communes",
      departement,
      region,
      "MO",
      "Gestionnaire",
      annee_creation::integer,
      longueur_reseau::numeric(10, 1),
      nb_pdl::integer,
      "contenu CO2"::numeric(10, 3),
      "contenu CO2 ACV"::numeric(10, 3),
      "Rend%"::integer,
      "production_totale_MWh"::integer,
      "puissance_totale_MW"::numeric(10, 2),
      "livraisons_totale_MWh"::numeric(10, 2),
      "livraisons_residentiel_MWh"::numeric(10, 2),
      "livraisons_tertiaire_MWh"::numeric(10, 2),
      "livraisons_industrie_MWh"::numeric(10, 2),
      "livraisons_agriculture_MWh"::numeric(10, 2),
      "livraisons_autre_MWh"::numeric(10, 2)
    FROM reseaux_de_froid
    order by "Identifiant reseau", id_fcu
  );

  drop view if exists opendata.reseaux_de_froid_shp;
  create view opendata.reseaux_de_froid_shp as (
    SELECT
      "geom",

      -- champs exportés en propriétés
      "Identifiant reseau",
      nom_reseau,
      array_to_string("communes", ',') as "communes",
      departement,
      region,
      "MO",
      "Gestionnaire",
      annee_creation::integer::text,
      longueur_reseau::numeric(10, 1)::text,
      nb_pdl::integer::text,
      "contenu CO2"::numeric(10, 3)::text,
      "contenu CO2 ACV"::numeric(10, 3)::text,
      "Rend%"::integer::text,
      "production_totale_MWh"::integer::text,
      "puissance_totale_MW"::numeric(10, 2)::text,
      "livraisons_totale_MWh"::numeric(10, 2)::text,
      "livraisons_residentiel_MWh"::numeric(10, 2)::text,
      "livraisons_tertiaire_MWh"::numeric(10, 2)::text,
      "livraisons_industrie_MWh"::numeric(10, 2)::text,
      "livraisons_agriculture_MWh"::numeric(10, 2)::text,
      "livraisons_autre_MWh"::numeric(10, 2)::text
    FROM reseaux_de_froid
    order by "Identifiant reseau", id_fcu
  );

  drop view if exists opendata.zone_de_developpement_prioritaire;
  create view opendata.zone_de_developpement_prioritaire as (
    SELECT
      "geom",

      -- champs exportés en propriétés
      "Identifiant reseau",
      array_to_string("communes", ',') as "communes",
      departement,
      region
    FROM zone_de_developpement_prioritaire
    order by "Identifiant reseau", id_fcu
  );

  drop view if exists opendata.zones_et_reseaux_en_construction;
  create view opendata.zones_et_reseaux_en_construction as (
    SELECT
      "geom",

      -- champs exportés en propriétés
      array_to_string("communes", ',') as "communes",
      departement,
      region,
      "gestionnaire",
      "mise_en_service"
    FROM zones_et_reseaux_en_construction
    order by id_fcu
  );
EOF

# Création des GeoJSON
dumpGeoJSON () {
  local tableName=$1
  local fileName=$2
  local whereCondition=$3

  $psql postgres://postgres:postgres_fcu@$DOCKER_HOST:5432/postgres -c "COPY (
    SELECT json_build_object(
        'type', 'FeatureCollection',
        'crs', json_build_object(
            'type', 'name',
            'properties', json_build_object(
              'name', 'EPSG:2154'
            )
        ),
        'features', json_agg(
            st_asgeojson(row)::json
        )
    )
    FROM opendata.$tableName row
    $whereCondition
  ) TO STDOUT" | sed -e 's/\\\\"/\\"/g' > "$fileName"
}

dumpGeoJSON reseaux_de_chaleur "$opendata_dir"/reseaux_de_chaleur.geojson "WHERE st_geometrytype(geom) = 'ST_MultiLineString'"
dumpGeoJSON reseaux_de_chaleur "$opendata_dir"/reseaux_de_chaleur_sans_traces.geojson "WHERE st_geometrytype(geom) <> 'ST_MultiLineString'"
dumpGeoJSON reseaux_de_froid "$opendata_dir"/reseaux_de_froid.geojson "WHERE st_geometrytype(geom) = 'ST_MultiLineString'"
dumpGeoJSON reseaux_de_froid "$opendata_dir"/reseaux_de_froid_sans_traces.geojson "WHERE st_geometrytype(geom) <> 'ST_MultiLineString'"
dumpGeoJSON zone_de_developpement_prioritaire "$opendata_dir"/pdp.geojson
dumpGeoJSON zones_et_reseaux_en_construction "$opendata_dir"/zones_et_reseaux_en_construction.geojson

# Création des shapefile
pgQuery="PG:host=$DOCKER_HOST user=postgres dbname=postgres password=postgres_fcu"

ogr2ogr -f "ESRI Shapefile" -lco ENCODING=UTF-8 /output/reseaux_de_chaleur.shp "$pgQuery" -sql "SELECT * FROM opendata.reseaux_de_chaleur_shp WHERE st_geometrytype(geom) = 'ST_MultiLineString'"
ogr2ogr -f "ESRI Shapefile" -lco ENCODING=UTF-8 /output/reseaux_de_chaleur_sans_traces.shp "$pgQuery" -sql "SELECT * FROM opendata.reseaux_de_chaleur_shp WHERE st_geometrytype(geom) = 'ST_Point'"
ogr2ogr -f "ESRI Shapefile" -lco ENCODING=UTF-8 /output/reseaux_de_froid.shp "$pgQuery" -sql "SELECT * FROM opendata.reseaux_de_froid_shp WHERE st_geometrytype(geom) = 'ST_MultiLineString'"
ogr2ogr -f "ESRI Shapefile" -lco ENCODING=UTF-8 /output/reseaux_de_froid_sans_traces.shp "$pgQuery" -sql "SELECT * FROM opendata.reseaux_de_froid_shp WHERE st_geometrytype(geom) = 'ST_Point'"
ogr2ogr -f "ESRI Shapefile" -lco ENCODING=UTF-8 /output/pdp.shp "$pgQuery" opendata.zone_de_developpement_prioritaire
ogr2ogr -f "ESRI Shapefile" -lco ENCODING=UTF-8 /output/reseaux_en_construction_traces.shp "$pgQuery" opendata.zones_et_reseaux_en_construction -sql "SELECT * FROM opendata.zones_et_reseaux_en_construction WHERE st_geometrytype(geom) = 'ST_MultiLineString'"
ogr2ogr -f "ESRI Shapefile" -lco ENCODING=UTF-8 /output/reseaux_en_construction_zones.shp "$pgQuery" opendata.zones_et_reseaux_en_construction -sql "SELECT * FROM opendata.zones_et_reseaux_en_construction WHERE st_geometrytype(geom) = 'ST_MultiPolygon'"

# Copie de doc
cp scripts/opendata/nomenclature_shapefile_des_reseaux_de_chaleur_et_froid.xlsx "$opendata_dir/"

# Création de l'archive
archiveName=$(date +%d%m%y)-opendata-fcu.zip
rm -f "$archiveName"
zip -j "$archiveName" "$opendata_dir"/*
echo -e "\nArchive opendata prête pour envoi => $archiveName
Prérequis : avoir un compte sur data.gouv.fr et avoir accès au compte France Chaleur Urbaine
1. Aller sur le jeu de données Tracés des réseaux de chaleur et de froid : https://www.data.gouv.fr/admin/datasets/64f05d3568e4d575eb454ffe
2. Ajouter une mise à jour avec l'archive avec le nom du fichier. Préciser le contenu de la mise à jour dans le champ 'Description'.
3. Enfin, modifier le fichier principal (opendata-fcu.zip) avec l'archive."
rm -r "$opendata_dir"
