# Potentiels de raccordement par territoire

Ce document contient les 3 requêtes permettant de construire les 3 fichiers statiques pour afficher la carte des potentiels de raccordement par territoire :
- public/data/stats-bdnb-2022-departements.json
- public/data/stats-bdnb-2022-national.json
- public/data/stats-bdnb-2022-regions.json

Les requêtes nécessitent la présence des tables `batiments_summary_reseaux_de_chaleur` et `departements`, créées par les scripts dans `/scripts/bdnb/`.


## Requêtes

```sql
-- stats par département
WITH
  close_50m as (
  SELECT
    code_departement_insee as code_departement,
    sum(
      CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN 1 ELSE 0 END
    ) as nb_batiments,
    sum(
      CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
    ) as nb_logements,

    jsonb_build_object(
      'collectif_fioul', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
      ),
      'collectif_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
      ),
      'individuel_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
      )
    ) as batiments,

    jsonb_build_object(
      'collectif_fioul', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ),
      'collectif_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ),
      'individuel_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      )
    ) as logements

  FROM batiments_summary_reseaux_de_chaleur
  WHERE is_close_50 is true
  GROUP BY code_departement_insee
),
  close_100m as (
  SELECT
    code_departement_insee as code_departement,
    sum(
      CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN 1 ELSE 0 END
    ) as nb_batiments,
    sum(
      CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
    ) as nb_logements,

    jsonb_build_object(
      'collectif_fioul', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
      ),
      'collectif_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
      ),
      'individuel_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
      )
    ) as batiments,

    jsonb_build_object(
      'collectif_fioul', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ),
      'collectif_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ),
      'individuel_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      )
    ) as logements

  FROM batiments_summary_reseaux_de_chaleur
  WHERE is_close_100 is true
  GROUP BY code_departement_insee
),
  close_150m as (
  SELECT
    code_departement_insee as code_departement,
    sum(
      CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN 1 ELSE 0 END
    ) as nb_batiments,
    sum(
      CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
    ) as nb_logements,

    jsonb_build_object(
      'collectif_fioul', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
      ),
      'collectif_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
      ),
      'individuel_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
      )
    ) as batiments,

    jsonb_build_object(
      'collectif_fioul', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ),
      'collectif_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ),
      'individuel_gaz', sum (
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      )
    ) as logements

  FROM batiments_summary_reseaux_de_chaleur
  WHERE is_close_150 is true
  GROUP BY code_departement_insee
)
SELECT
  json_agg(
    jsonb_build_object(
      'departement_code', d.code,
      'departement_nom', d.nom,
      'region_code', d.code_region,
      'region_nom', d.region,
      'nb_reseaux', COALESCE(stats_reseaux_par_departement.nb_reseaux, 0),
      'taux_enrr', stats_reseaux_par_departement.taux_enrr,
      '50m', COALESCE(
          to_jsonb(close_50m) - 'code_departement',
          '{
            "batiments": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "logements": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "nb_batiments": 0,
            "nb_logements": 0
          }'::jsonb
        ),
      '100m', COALESCE(
          to_jsonb(close_100m) - 'code_departement',
          '{
            "batiments": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "logements": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "nb_batiments": 0,
            "nb_logements": 0
          }'::jsonb
        ),
      '150m', COALESCE(
          to_jsonb(close_150m) - 'code_departement',
          '{
            "batiments": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "logements": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "nb_batiments": 0,
            "nb_logements": 0
          }'::jsonb
        )
    )
  )
FROM departements d
LEFT JOIN close_50m on close_50m.code_departement = d.code
LEFT JOIN close_100m on close_100m.code_departement = d.code
LEFT JOIN close_150m on close_150m.code_departement = d.code
LEFT JOIN stats_reseaux_par_departement on stats_reseaux_par_departement.code_departement = d.code;


-- stats par région
WITH
  close_50m as (
    SELECT
      d.code_region,
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN 1 ELSE 0 END
      ) as nb_batiments,
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ) as nb_logements,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        )
      ) as batiments,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        )
      ) as logements

    FROM batiments_summary_reseaux_de_chaleur b
    JOIN departements d on d.code = b.code_departement_insee
    WHERE is_close_50 is true
    GROUP BY d.code_region
  ),
  close_100m as (
    SELECT
      d.code_region,
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN 1 ELSE 0 END
      ) as nb_batiments,
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ) as nb_logements,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        )
      ) as batiments,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        )
      ) as logements

    FROM batiments_summary_reseaux_de_chaleur b
    JOIN departements d on d.code = b.code_departement_insee
    WHERE is_close_100 is true
    GROUP BY d.code_region
),
  close_150m as (
    SELECT
      d.code_region,
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN 1 ELSE 0 END
      ) as nb_batiments,
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ) as nb_logements,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        )
      ) as batiments,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        )
      ) as logements

    FROM batiments_summary_reseaux_de_chaleur b
    JOIN departements d on d.code = b.code_departement_insee
    WHERE is_close_150 is true
    GROUP BY d.code_region
)
SELECT
  json_agg(
    jsonb_build_object(
      'region_code', r.code_region,
      'region_nom', r.region,
      'nb_reseaux', COALESCE(stats_reseaux_par_region.nb_reseaux, 0),
      'taux_enrr', stats_reseaux_par_region.taux_enrr,
      '50m', COALESCE(
          to_jsonb(close_50m) - 'code_region',
          '{
            "batiments": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "logements": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "nb_batiments": 0,
            "nb_logements": 0
          }'::jsonb
        ),
      '100m', COALESCE(
          to_jsonb(close_100m) - 'code_region',
          '{
            "batiments": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "logements": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "nb_batiments": 0,
            "nb_logements": 0
          }'::jsonb
        ),
      '150m', COALESCE(
          to_jsonb(close_150m) - 'code_region',
          '{
            "batiments": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "logements": {
              "collectif_fioul": 0,
              "collectif_gaz": 0,
              "individuel_gaz": 0
            },
            "nb_batiments": 0,
            "nb_logements": 0
          }'::jsonb
        )
    )
  )
FROM (
  SELECT distinct code_region, region
  FROM departements
  ORDER by code_region
) r
LEFT JOIN close_50m on close_50m.code_region = r.code_region
LEFT JOIN close_100m on close_100m.code_region = r.code_region
LEFT JOIN close_150m on close_150m.code_region = r.code_region
LEFT JOIN stats_reseaux_par_region on stats_reseaux_par_region.code_region = r.code_region;


-- stats nationales
WITH
  close_50m as (
    SELECT
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN 1 ELSE 0 END
      ) as nb_batiments,
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ) as nb_logements,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        )
      ) as batiments,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        )
      ) as logements

    FROM batiments_summary_reseaux_de_chaleur b
    WHERE is_close_50 is true
  ),
  close_100m as (
    SELECT
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN 1 ELSE 0 END
      ) as nb_batiments,
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ) as nb_logements,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        )
      ) as batiments,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        )
      ) as logements

    FROM batiments_summary_reseaux_de_chaleur b
    WHERE is_close_100 is true
),
  close_150m as (
    SELECT
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN 1 ELSE 0 END
      ) as nb_batiments,
      sum(
        CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND (dpe_mix_arrete_type_energie_chauffage = 'fioul' OR dpe_mix_arrete_type_energie_chauffage = 'gaz') THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
      ) as nb_logements,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN 1 ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN 1 ELSE 0 END
        )
      ) as batiments,

      jsonb_build_object(
        'collectif_fioul', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'fioul' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'collectif_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'collectif' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        ),
        'individuel_gaz', sum (
          CASE WHEN dpe_mix_arrete_type_installation_chauffage = 'individuel' AND dpe_mix_arrete_type_energie_chauffage = 'gaz' THEN COALESCE(ffo_bat_nb_log, 0) ELSE 0 END
        )
      ) as logements

    FROM batiments_summary_reseaux_de_chaleur b
    WHERE is_close_150 is true
)
SELECT
  jsonb_build_object(
    'nb_reseaux', COALESCE(stats_tational.nb_reseaux, 0),
    'taux_enrr', stats_tational.taux_enrr,
    '50m', to_jsonb(close_50m),
    '100m', to_jsonb(close_100m),
    '150m', to_jsonb(close_150m)
  )
FROM
  (VALUES (946, 66.5)) as stats_tational(nb_reseaux, taux_enrr),
  close_50m,
  close_100m,
  close_150m;
```
