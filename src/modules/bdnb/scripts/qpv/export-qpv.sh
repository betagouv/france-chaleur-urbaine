#!/bin/bash -e

# Permet d'obtenir un fichier CSV avec pour chaque QPV (quartiers prioritaires) :
# - code QPV
# - nombre de réseaux de chaleur existants dans le QPV
#   - dont nombre de réseaux classés
# - nombre de réseaux de froid existants dans le QPV
# - ID du réseau ou des réseaux (si ID existant)
# - présence de réseaux de chaleur en construction (oui/non)
# - présence d'un périmètre de développement prioritaire dans le QPV (oui/non)
# - présence d'une zone à fort potentiel pour la création d'un réseau dans le QPV (oui/non)
# - présence d'une zone à potentiel pour la création d'un réseau dans le QPV (oui/non)
# - nb bâtiments et nb logements à chauffage collectif gaz à moins de 50 m d'un réseau de chaleur existant ou en construction dans le QPV
#   - dont en PDP
# - nb bâtiments et nb logements à chauffage collectif fioul à moins de 50 m d'un réseau de chaleur existant ou en construction dans le QPV
#   - dont en PDP
# - nb bâtiments et nb logements à chauffage collectif gaz à moins de 100 m d'un réseau de chaleur existant ou en construction dans le QPV
#   - dont en PDP
# - nb bâtiments et nb logements à chauffage collectif fioul à moins de 100 m d'un réseau de chaleur existant ou en construction dans le QPV
#   - dont en PDP
# - nb bâtiments et nb logements à chauffage collectif gaz dans une zone de réseau de chaleur en construction dans le QPV (si tracé du futur réseau non disponible)
# - nb bâtiments et nb logements à chauffage collectif fioul dans une zone de réseau de chaleur en construction dans le QPV (si tracé du futur réseau non disponible)
#
# Il faut avoir au préalable préparé les données avec le script prepare-batiments-summary-qpv.sh

sql="psql postgres://postgres:postgres_fcu@localhost:5432"
SECONDS=0

outputFile=extraction_données_fcu_qpv_$(date +%d-%m-%Y).csv
$sql <<EOF >$outputFile
COPY (
with
  infos_qp as (
    select
      qpv.code_qp,

      -- nombre de réseaux de chaleur existants dans le QPV
      (
        SELECT count(id_fcu)
        FROM reseaux_de_chaleur
        WHERE ST_Intersects(geom, qpv.geom)
      ) as nb_reseaux_de_chaleur,

      -- dont nombre de réseaux classés
      (
        SELECT count(id_fcu)
        FROM reseaux_de_chaleur
        WHERE ST_Intersects(geom, qpv.geom)
          AND "reseaux classes" is true
      ) as nb_reseaux_de_chaleur_classe,

      -- nombre de réseaux de froid existants dans le QPV
      (
        SELECT count(id_fcu)
        FROM reseaux_de_froid
        WHERE ST_Intersects(geom, qpv.geom)
      ) as nb_reseaux_de_froid,

      -- ID du réseau ou des réseaux
      (
        select string_agg(id, ', ')
        from (
          SELECT "Identifiant reseau" as id
          FROM reseaux_de_chaleur
          WHERE ST_Intersects(geom, qpv.geom)
          UNION all
          SELECT "Identifiant reseau" as id
          FROM reseaux_de_froid
          WHERE ST_Intersects(geom, qpv.geom)
        ) ids
      ) as id_reseaux,

      -- présence de réseaux de chaleur en construction
      (
        SELECT case when count(id_fcu) > 0 then 'oui' else 'non' end
        FROM zones_et_reseaux_en_construction
        WHERE ST_Intersects(geom, qpv.geom)
      ) as contient_reseaux_de_chaleur_en_construction,

      -- présence d'un périmètre de développement prioritaire dans le QPV
      (
        SELECT case when count(id_fcu) > 0 then 'oui' else 'non' end
        FROM zone_de_developpement_prioritaire
        WHERE ST_Intersects(geom, qpv.geom)
      ) as contient_perimetre_de_developpement_prioritaire,

      -- présence d'une zone à fort potentiel pour la création d'un réseau dans le QPV
      (
        SELECT case when count(*) > 0 then 'oui' else 'non' end
        FROM zone_a_potentiel_chaud
        WHERE ST_Intersects(geom, qpv.geom)
      ) as contient_zone_a_potentiel_chaud,

      -- présence d'une zone à potentiel pour la création d'un réseau dans le QPV
      (
        SELECT case when count(*) > 0 then 'oui' else 'non' end
        FROM zone_a_potentiel_fort_chaud
        WHERE ST_Intersects(geom, qpv.geom)
      ) as contient_zone_a_potentiel_fort_chaud

    from quartiers_prioritaires_politique_ville qpv
  ),
  infos_batiments as (
    select
      qpv.code_qp,

      -- nb bâtiments et nb logements à chauffage collectif gaz à moins de 50 m d'un réseau de chaleur existant ou en construction dans le QPV
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and (
            "nearest_reseau_de_chaleur - distance" < 50
        or "nearest_reseau_en_construction - distance" < 50
        )
      THEN 1 END), 0) as "-50m réseau - nb batiments collectif gaz",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and (
            "nearest_reseau_de_chaleur - distance" < 50
        or "nearest_reseau_en_construction - distance" < 50
        )
      THEN nb_logements END), 0) as "-50m réseau - nb logements collectif gaz",
      -- dont en PDP
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and (
            "nearest_reseau_de_chaleur - distance" < 50
        or "nearest_reseau_en_construction - distance" < 50
        )
        and "perimetre_de_developpement_prioritaire - in_zone" is true
      THEN 1 END), 0) as "-50m réseau - dans PDP - nb batiments collectif gaz",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and (
            "nearest_reseau_de_chaleur - distance" < 50
        or "nearest_reseau_en_construction - distance" < 50
        )
        and "perimetre_de_developpement_prioritaire - in_zone" is true
      THEN nb_logements END), 0) as "-50m réseau - dans PDP - nb logements collectif gaz",

      -- nb bâtiments et nb logements à chauffage collectif fioul à moins de 50 m d'un réseau de chaleur existant ou en construction dans le QPV
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and (
            "nearest_reseau_de_chaleur - distance" < 50
        or "nearest_reseau_en_construction - distance" < 50
        )
      THEN 1 END), 0) as "-50m réseau - nb batiments collectif fioul",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and (
            "nearest_reseau_de_chaleur - distance" < 50
        or "nearest_reseau_en_construction - distance" < 50
        )
      THEN nb_logements END), 0) as "-50m réseau - nb logements collectif fioul",
      -- dont en PDP
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and (
            "nearest_reseau_de_chaleur - distance" < 50
        or "nearest_reseau_en_construction - distance" < 50
        )
        and "perimetre_de_developpement_prioritaire - in_zone" is true
      THEN 1 END), 0) as "-50m réseau - dans PDP - nb batiments collectif fioul",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and (
            "nearest_reseau_de_chaleur - distance" < 50
        or "nearest_reseau_en_construction - distance" < 50
        )
        and "perimetre_de_developpement_prioritaire - in_zone" is true
      THEN nb_logements END), 0) as "-50m réseau - dans PDP - nb logements collectif fioul",

      -- nb bâtiments et nb logements à chauffage collectif gaz à moins de 100 m d'un réseau de chaleur existant ou en construction dans le QPV
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and (
            "nearest_reseau_de_chaleur - distance" < 100
        or "nearest_reseau_en_construction - distance" < 100
        )
      THEN 1 END), 0) as "-100m réseau - nb batiments collectif gaz",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and (
            "nearest_reseau_de_chaleur - distance" < 100
        or "nearest_reseau_en_construction - distance" < 100
        )
      THEN nb_logements END), 0) as "-100m réseau - nb logements collectif gaz",
      -- dont en PDP
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and (
            "nearest_reseau_de_chaleur - distance" < 100
        or "nearest_reseau_en_construction - distance" < 100
        )
        and "perimetre_de_developpement_prioritaire - in_zone" is true
      THEN 1 END), 0) as "-100m réseau - dans PDP - nb batiments collectif gaz",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and (
            "nearest_reseau_de_chaleur - distance" < 100
        or "nearest_reseau_en_construction - distance" < 100
        )
        and "perimetre_de_developpement_prioritaire - in_zone" is true
      THEN nb_logements END), 0) as "-100m réseau - dans PDP - nb logements collectif gaz",

      -- nb bâtiments et nb logements à chauffage collectif fioul à moins de 100 m d'un réseau de chaleur existant ou en construction dans le QPV
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and (
            "nearest_reseau_de_chaleur - distance" < 100
        or "nearest_reseau_en_construction - distance" < 100
        )
      THEN 1 END), 0) as "-100m réseau - nb batiments collectif fioul",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and (
            "nearest_reseau_de_chaleur - distance" < 100
        or "nearest_reseau_en_construction - distance" < 100
        )
      THEN nb_logements END), 0) as "-100m réseau - nb logements collectif fioul",
      -- dont en PDP
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and (
            "nearest_reseau_de_chaleur - distance" < 100
        or "nearest_reseau_en_construction - distance" < 100
        )
        and "perimetre_de_developpement_prioritaire - in_zone" is true
      THEN 1 END), 0) as "-100m réseau - dans PDP - nb batiments collectif fioul",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and (
            "nearest_reseau_de_chaleur - distance" < 100
        or "nearest_reseau_en_construction - distance" < 100
        )
        and "perimetre_de_developpement_prioritaire - in_zone" is true
      THEN nb_logements END), 0) as "-100m réseau - dans PDP - nb logements collectif fioul",

      -- nb bâtiments et nb logements à chauffage collectif gaz dans une zone de réseau de chaleur en construction dans le QPV (si tracé du futur réseau non disponible)
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and "zone_reseau_en_construction - in_zone" is true
      THEN 1 END), 0) as "dans zone réseau construction - nb batiments collectif gaz",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and "zone_reseau_en_construction - in_zone" is true
      THEN nb_logements END), 0) as "dans zone réseau construction - nb logements collectif gaz",

      -- nb bâtiments et nb logements à chauffage collectif fioul dans une zone de réseau de chaleur en construction dans le QPV (si tracé du futur réseau non disponible)
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and "zone_reseau_en_construction - in_zone" is true
      THEN 1 END), 0) as "dans zone réseau construction - nb batiments collectif fioul",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and "zone_reseau_en_construction - in_zone" is true
      THEN nb_logements END), 0) as "dans zone réseau construction - nb logements collectif fioul",

      -- nb bâtiments et nb logements à chauffage collectif gaz dans le QPV dans une zone à potentiel
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and "zone_a_potentiel_chaud - in_zone" is true
      THEN 1 END), 0) as "dans zone à potentiel - nb batiments collectif gaz",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and "zone_a_potentiel_chaud - in_zone" is true
      THEN nb_logements END), 0) as "dans zone à potentiel - nb logements collectif gaz",

      -- nb bâtiments et nb logements à chauffage collectif fioul dans le QPV dans une zone à potentiel
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and "zone_a_potentiel_chaud - in_zone" is true
      THEN 1 END), 0) as "dans zone à potentiel - nb batiments collectif fioul",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and "zone_a_potentiel_chaud - in_zone" is true
      THEN nb_logements END), 0) as "dans zone à potentiel - nb logements collectif fioul",

      -- nb bâtiments et nb logements à chauffage collectif gaz dans le QPV dans une zone à fort potentiel
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and "zone_a_potentiel_fort_chaud - in_zone" is true
      THEN 1 END), 0) as "dans zone à fort potentiel - nb batiments collectif gaz",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'gaz'
        and "zone_a_potentiel_fort_chaud - in_zone" is true
      THEN nb_logements END), 0) as "dans zone à fort potentiel - nb logements collectif gaz",

      -- nb bâtiments et nb logements à chauffage collectif fioul dans le QPV dans une zone à fort potentiel
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and "zone_a_potentiel_fort_chaud - in_zone" is true
      THEN 1 END), 0) as "dans zone à fort potentiel - nb batiments collectif fioul",
      coalesce(sum (CASE WHEN
        "quartier_prioritaire - in_zone" is true
        and type_installation_chauffage = 'collectif'
        and type_energie_chauffage = 'fioul'
        and "zone_a_potentiel_fort_chaud - in_zone" is true
      THEN nb_logements END), 0) as "dans zone à fort potentiel - nb logements collectif fioul"


    from quartiers_prioritaires_politique_ville qpv
    left join data.bdnb_batiments_infos_proximite batiment on batiment."quartier_prioritaire - code_qp"  = qpv.code_qp
    group by qpv.code_qp
  )
select
  *
from infos_qp qpv
left join infos_batiments bat using (code_qp)
order by qpv.code_qp
) TO stdout WITH CSV DELIMITER ',' HEADER
EOF

echo "> Fichier CSV créé ($SECONDS secondes) => $outputFile"
