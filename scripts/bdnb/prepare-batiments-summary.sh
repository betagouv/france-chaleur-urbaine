#!/bin/bash -e

# Prépare et calcule les distance entre les batiments et les réseaux en utilisant la table bndb_registre_2022.
# Plutôt que calculer d'un coup toutes les distances, ce qui peut prendre globalement 6h20 en local avec juste 1 CPU à fond
# et pas de mémoire ou disque utilisé, on parallélise au maximum en lançant $(nproc) requêtes en parallèle.
# Les requêtes travaillent sur un sous-ensemble de la bdnb 24 millions de lignes qui est découpée par tranches de 10k batiments
# pour paralléliser au mieux, car certaines tranches de batiments mettent quelques millisecondes à être traitées tandis que
# d'autres mettent jusqu'à 20 minutes...
# Grâce à cette parallélisation, le script met 25 minutes en local et utilise 2400 tables temporaires.

# Configuration
outputTable=batiments_summary

SECONDS=0
sql="psql --quiet --no-align --pset=tuples_only postgres://postgres:postgres_fcu@localhost:5432"

seriesQueryPart="
SELECT
  generate_series(1, 24000000, 10000) as start_id,
  generate_series(10000, 24000000, 10000) as end_id
"

# Ecrit dans un fichier en plus de la sortie standard
exec &> >(tee batiments-summary.log)

# 1. Suppression des tables temporaires si existantes
$sql -c "$(
  $sql <<EOF
SELECT
  'drop table if exists ${outputTable}_' || row_number() over () || ';'
FROM (
  $seriesQueryPart
) as sub;
EOF
)"

# 2. Lancement des calculs de proximité en parallèle
queryPart=$(
  cat <<EOF
SELECT
  id,
  code_departement_insee,
  departements.nom as departement,
  departements.region,
  dpe_mix_arrete_type_installation_chauffage,
  dpe_mix_arrete_type_energie_chauffage,
  ffo_bat_nb_log,

  EXISTS (
    SELECT *
    FROM reseaux_de_chaleur reseau
    WHERE ST_DWithin(
      batiment.geom,
      reseau.geom,
      50)
    LIMIT 1
  ) as is_close_50,

  EXISTS (
    SELECT *
    FROM reseaux_de_chaleur reseau
    WHERE ST_DWithin(
      batiment.geom,
      reseau.geom,
      100)
    LIMIT 1
  ) as is_close_100,

  EXISTS (
    SELECT *
    FROM reseaux_de_chaleur reseau
    WHERE ST_DWithin(
      batiment.geom,
      reseau.geom,
      150)
    LIMIT 1
  ) as is_close_150

FROM bdnb_registre_2022 as batiment
LEFT JOIN departements ON departements.code = batiment.code_departement_insee
EOF
)

queries=$(
  $sql -F SEPARATOR <<EOF
SELECT
  'create unlogged table ${outputTable}_' || row_number() over () || ' as ($queryPart WHERE id BETWEEN ' || start_id || ' AND ' || end_id || '); select ''${outputTable}_' || row_number() over () || '''; SEPARATOR'
FROM (
  $seriesQueryPart
) as sub;
EOF
)

parallel --jobs $(nproc) --delimiter SEPARATOR /usr/bin/time -f '%E' $sql -c "{}" <<EOF
$queries
EOF

echo "> Calculs terminés ($SECONDS secondes)"
SECONDS=0

# 3. Réassemblage de la table
queries=$(
  $sql <<EOF
select string_agg('SELECT * FROM ${outputTable}_' || id, ' UNION ALL ')
from (
  select row_number() over () as id
  FROM (
    $seriesQueryPart
  ) c1
) c2
EOF
)

$sql -c "CREATE TABLE $outputTable AS (
$queries
)"

echo "> Table finale assemblée $outputTable ($SECONDS secondes)"

# 4. Nettoyage des tables temporaires
$sql -c "$(
  $sql <<EOF
SELECT
  'drop table if exists ${outputTable}_' || row_number() over () || ';'
FROM (
  $seriesQueryPart
) as sub;
EOF
)"
