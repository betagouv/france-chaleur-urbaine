#!/bin/bash -e

# Permet d'exporter les métriques demandées à partir de la table batiments_summary, elle-même construite à partir
# des informations de bdnb_registre_2022
# 3 fichiers CSV sont exportés : -50m, -100m et -150m.
sql="psql postgres://postgres:postgres_fcu@localhost:5432"

SECONDS=0

queryColumns=$(
  cat <<EOF
  code_departement_insee,
  departement,
  region,
  count(*) as nb_batiments,
  sum(ffo_bat_nb_log) as nb_logements,

  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'solaire' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - solaire",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'fioul_domestique' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - fioul_domestique",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'gpl/butane/propane' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - gpl/butane/propane",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - fioul",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - gaz",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'reseau de chaleur' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - reseau de chaleur",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'bois' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - bois",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'gaz_naturel' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - gaz_naturel",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'electricite' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - electricite",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'charbon' THEN 1 ELSE 0 END
  ) as "nb batiments - individuel - charbon",

  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'solaire' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - solaire",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'fioul_domestique' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - fioul_domestique",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'gpl/butane/propane' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - gpl/butane/propane",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - fioul",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - gaz",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'reseau de chaleur' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - reseau de chaleur",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'bois' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - bois",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'gaz_naturel' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - gaz_naturel",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'electricite' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - electricite",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'charbon' THEN 1 ELSE 0 END
  ) as "nb batiments - collectif - charbon",

  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'solaire' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - solaire",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'fioul_domestique' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - fioul_domestique",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'gpl/butane/propane' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - gpl/butane/propane",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - fioul",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - gaz",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'reseau de chaleur' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - reseau de chaleur",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'bois' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - bois",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'gaz_naturel' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - gaz_naturel",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'electricite' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - electricite",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' and dpe_mix_arrete_type_energie_chauffage = 'charbon' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - individuel - charbon",

  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'solaire' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - solaire",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'fioul_domestique' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - fioul_domestique",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'gpl/butane/propane' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - gpl/butane/propane",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - fioul",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - gaz",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'reseau de chaleur' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - reseau de chaleur",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'bois' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - bois",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'gaz_naturel' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - gaz_naturel",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'electricite' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - electricite",
  sum (
    CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' and dpe_mix_arrete_type_energie_chauffage = 'charbon' THEN ffo_bat_nb_log ELSE 0 END
  ) as "nb logements - collectif - charbon"
EOF
)

sourceTable=batiments_summary_reseaux_de_chaleur
outfileFilePrefix=export_bdnb_registre_2022_proches_reseaux_chaleur_11-2023
$sql <<EOF >${outfileFilePrefix}_moins50m.csv
COPY (
SELECT
  $queryColumns
FROM ${sourceTable}
WHERE is_close_50 is true
GROUP BY code_departement_insee, departement, region
) TO stdout WITH CSV DELIMITER ',' HEADER;
EOF

$sql <<EOF >${outfileFilePrefix}_moins100m.csv
COPY (
SELECT
  $queryColumns
FROM ${sourceTable}
WHERE is_close_100 is true
GROUP BY code_departement_insee, departement, region
) TO stdout WITH CSV DELIMITER ',' HEADER;
EOF

$sql <<EOF >${outfileFilePrefix}_moins150m.csv
COPY (
SELECT
  $queryColumns
FROM ${sourceTable}
WHERE is_close_150 is true
GROUP BY code_departement_insee, departement, region
) TO stdout WITH CSV DELIMITER ',' HEADER;
EOF

sourceTable=batiments_summary_reseaux_en_construction
outfileFilePrefix=export_bdnb_registre_2022_proches_reseaux_construction_11-2023
$sql <<EOF >${outfileFilePrefix}_moins50m.csv
COPY (
SELECT
  $queryColumns
FROM ${sourceTable}
WHERE is_close_50 is true
GROUP BY code_departement_insee, departement, region
) TO stdout WITH CSV DELIMITER ',' HEADER;
EOF

$sql <<EOF >${outfileFilePrefix}_moins100m.csv
COPY (
SELECT
  $queryColumns
FROM ${sourceTable}
WHERE is_close_100 is true
GROUP BY code_departement_insee, departement, region
) TO stdout WITH CSV DELIMITER ',' HEADER;
EOF

$sql <<EOF >${outfileFilePrefix}_moins150m.csv
COPY (
SELECT
  $queryColumns
FROM ${sourceTable}
WHERE is_close_150 is true
GROUP BY code_departement_insee, departement, region
) TO stdout WITH CSV DELIMITER ',' HEADER;
EOF

$sql <<EOF >${outfileFilePrefix}_dans_zone.csv
COPY (
SELECT
  $queryColumns
FROM ${sourceTable}
WHERE is_in_zone is true
GROUP BY code_departement_insee, departement, region
) TO stdout WITH CSV DELIMITER ',' HEADER;
EOF

echo "> Fichiers exportés avec succès ($SECONDS secondes)"
