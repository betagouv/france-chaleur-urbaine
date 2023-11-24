#!/bin/bash -e

# Permet d'exporter les fichiers CSV à partir des tables batiments_summary_*, construites avec le script prepare-batiments-summary.sh

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

sourceTable=conso_summary_reseaux_de_chaleur
outfileFilePrefix=export_consos_11-2023
$sql <<EOF >${outfileFilePrefix}.csv
COPY (
SELECT
  code_departement_insee,
  departement,
  region,
  count(*) as nb_batiments,

  SUM (
    CASE WHEN code_grand_secteur = 'R' AND is_close_150_rdc is true THEN conso_nb ELSE 0 END
  ) AS "Résidentiel -150m réseau",
  SUM (
    CASE WHEN code_grand_secteur = 'R' AND is_close_100_rdc is true THEN conso_nb ELSE 0 END
  ) AS "Résidentiel -100m réseau",
  SUM (
    CASE WHEN code_grand_secteur = 'R' AND is_close_50_rdc is true THEN conso_nb ELSE 0 END
  ) AS "Résidentiel -50m réseau",
  SUM (
    CASE WHEN code_grand_secteur = 'R' AND is_close_150_construction is true THEN conso_nb ELSE 0 END
  ) AS "Résidentiel -150m réseau construction",
  SUM (
    CASE WHEN code_grand_secteur = 'R' AND is_close_100_construction is true THEN conso_nb ELSE 0 END
  ) AS "Résidentiel -100m réseau construction",
  SUM (
    CASE WHEN code_grand_secteur = 'R' AND is_close_50_construction is true THEN conso_nb ELSE 0 END
  ) AS "Résidentiel -50m réseau construction",
  SUM (
    CASE WHEN code_grand_secteur = 'R' AND is_in_zone_construction is true THEN conso_nb ELSE 0 END
  ) AS "Résidentiel dans zone construction",

  SUM (
    CASE WHEN code_grand_secteur = 'T' AND is_close_150_rdc is true THEN conso_nb ELSE 0 END
  ) AS "Tertiaire -150m réseau",
  SUM (
    CASE WHEN code_grand_secteur = 'T' AND is_close_100_rdc is true THEN conso_nb ELSE 0 END
  ) AS "Tertiaire -100m réseau",
  SUM (
    CASE WHEN code_grand_secteur = 'T' AND is_close_50_rdc is true THEN conso_nb ELSE 0 END
  ) AS "Tertiaire -50m réseau",
  SUM (
    CASE WHEN code_grand_secteur = 'T' AND is_close_150_construction is true THEN conso_nb ELSE 0 END
  ) AS "Tertiaire -150m réseau construction",
  SUM (
    CASE WHEN code_grand_secteur = 'T' AND is_close_100_construction is true THEN conso_nb ELSE 0 END
  ) AS "Tertiaire -100m réseau construction",
  SUM (
    CASE WHEN code_grand_secteur = 'T' AND is_close_50_construction is true THEN conso_nb ELSE 0 END
  ) AS "Tertiaire -50m réseau construction",
  SUM (
    CASE WHEN code_grand_secteur = 'T' AND is_in_zone_construction is true THEN conso_nb ELSE 0 END
  ) AS "Tertiaire dans zone construction",

  SUM (
    CASE WHEN code_grand_secteur = 'I' AND is_close_150_rdc is true THEN conso_nb ELSE 0 END
  ) AS "Industriel -150m réseau",
  SUM (
    CASE WHEN code_grand_secteur = 'I' AND is_close_100_rdc is true THEN conso_nb ELSE 0 END
  ) AS "Industriel -100m réseau",
  SUM (
    CASE WHEN code_grand_secteur = 'I' AND is_close_50_rdc is true THEN conso_nb ELSE 0 END
  ) AS "Industriel -50m réseau",
  SUM (
    CASE WHEN code_grand_secteur = 'I' AND is_close_150_construction is true THEN conso_nb ELSE 0 END
  ) AS "Industriel -150m réseau construction",
  SUM (
    CASE WHEN code_grand_secteur = 'I' AND is_close_100_construction is true THEN conso_nb ELSE 0 END
  ) AS "Industriel -100m réseau construction",
  SUM (
    CASE WHEN code_grand_secteur = 'I' AND is_close_50_construction is true THEN conso_nb ELSE 0 END
  ) AS "Industriel -50m réseau construction",
  SUM (
    CASE WHEN code_grand_secteur = 'I' AND is_in_zone_construction is true THEN conso_nb ELSE 0 END
  ) AS "Industriel dans zone construction"

FROM ${sourceTable}
GROUP BY code_departement_insee, departement, region
) TO stdout WITH CSV DELIMITER ',' HEADER;
EOF

sourceTable=parc_immobilier_etat_20211231_summary_reseaux_de_chaleur
outfileFilePrefix=export_parc_immobilier_etat_11-2023

queryColumns=$(
  cat <<EOF
  code_departement_insee,
  departement,
  region,
  count(*) as nb_batiments,

  sum (
    CASE WHEN type_de_chauffage = 'Fioul, Gaz' THEN 1 ELSE 0 END
  ) as "nb batiments - Fioul, Gaz",
  sum (
    CASE WHEN type_de_chauffage = 'Réseau de chaleur, Réseau de chaleur' THEN 1 ELSE 0 END
  ) as "nb batiments - Réseau de chaleur, Réseau de chaleur",
  sum (
    CASE WHEN type_de_chauffage = 'Bois' THEN 1 ELSE 0 END
  ) as "nb batiments - Bois",
  sum (
    CASE WHEN type_de_chauffage = 'Gaz, Gaz' THEN 1 ELSE 0 END
  ) as "nb batiments - Gaz, Gaz",
  sum (
    CASE WHEN type_de_chauffage = 'Électricité, Gaz' THEN 1 ELSE 0 END
  ) as "nb batiments - Électricité, Gaz",
  sum (
    CASE WHEN type_de_chauffage = 'Propane' THEN 1 ELSE 0 END
  ) as "nb batiments - Propane",
  sum (
    CASE WHEN type_de_chauffage = 'Électricité' THEN 1 ELSE 0 END
  ) as "nb batiments - Électricité",
  sum (
    CASE WHEN type_de_chauffage = 'Réseau de chaleur' THEN 1 ELSE 0 END
  ) as "nb batiments - Réseau de chaleur",
  sum (
    CASE WHEN type_de_chauffage = 'Gaz, Électricité' THEN 1 ELSE 0 END
  ) as "nb batiments - Gaz, Électricité",
  sum (
    CASE WHEN type_de_chauffage = 'Électricité, Électricité' THEN 1 ELSE 0 END
  ) as "nb batiments - Électricité, Électricité",
  sum (
    CASE WHEN type_de_chauffage = 'Fioul, Fioul' THEN 1 ELSE 0 END
  ) as "nb batiments - Fioul, Fioul",
  sum (
    CASE WHEN type_de_chauffage = 'Réseau de chaleur, Électricité' THEN 1 ELSE 0 END
  ) as "nb batiments - Réseau de chaleur, Électricité",
  sum (
    CASE WHEN type_de_chauffage = 'Réseau de chaleur, Fioul' THEN 1 ELSE 0 END
  ) as "nb batiments - Réseau de chaleur, Fioul",
  sum (
    CASE WHEN type_de_chauffage = 'Électricité, Réseau de chaleur' THEN 1 ELSE 0 END
  ) as "nb batiments - Électricité, Réseau de chaleur",
  sum (
    CASE WHEN type_de_chauffage = 'Gaz' THEN 1 ELSE 0 END
  ) as "nb batiments - Gaz",
  sum (
    CASE WHEN type_de_chauffage = 'Fioul' THEN 1 ELSE 0 END
  ) as "nb batiments - Fioul",
  sum (
    CASE WHEN type_de_chauffage is null THEN 1 ELSE 0 END
  ) as "nb batiments - Non renseigné"
EOF
)

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

echo "> Fichiers exportés avec succès ($SECONDS secondes)"
