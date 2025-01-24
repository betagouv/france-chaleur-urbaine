#!/bin/bash -e

# Prépare des métadonnées et métriques pour chaque batiment de la BDNB (bndb_registre_2022).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR"/lib.sh

# Décommenter pour écrire dans un fichier en plus de la sortie standard
# exec &> >(tee batiments-summary.log)

# 1. Calcul de plein d'informations coûteuses pour chaque batiment de la BDNB
split_table_query data.computed_batiments_infos_proximite id 10000 24000000 '
SELECT
  id,
  code_departement_insee,
  dpe_mix_arrete_type_installation_chauffage as type_installation_chauffage,
  dpe_mix_arrete_type_energie_chauffage as type_energie_chauffage,
  COALESCE(batiment.ffo_bat_nb_log, 0) as nb_logements,

  nearest_reseau_de_chaleur.id_fcu as "nearest_reseau_de_chaleur - id_fcu",
  nearest_reseau_de_chaleur.id_sncu as "nearest_reseau_de_chaleur - id_sncu",
  nearest_reseau_de_chaleur.distance as "nearest_reseau_de_chaleur - distance",
  nearest_reseau_de_froid.id_fcu as "nearest_reseau_de_froid - id_fcu",
  nearest_reseau_de_froid.id_sncu as "nearest_reseau_de_froid - id_sncu",
  nearest_reseau_de_froid.distance as "nearest_reseau_de_froid - distance",
  nearest_reseau_en_construction.id_fcu as "nearest_reseau_en_construction - id_fcu",
  nearest_reseau_en_construction.distance as "nearest_reseau_en_construction - distance",
  zone_reseau_en_construction.id_fcu as "zone_reseau_en_construction - id_fcu",
  coalesce(zone_reseau_en_construction.in_zone, false) as "zone_reseau_en_construction - in_zone",
  perimetre_de_developpement_prioritaire.id_fcu as "perimetre_de_developpement_prioritaire - id_fcu",
  perimetre_de_developpement_prioritaire.id_sncu as "perimetre_de_developpement_prioritaire - id_sncu",
  coalesce(perimetre_de_developpement_prioritaire.in_zone, false) as "perimetre_de_developpement_prioritaire - in_zone",
  quartier_prioritaire.code_qp as "quartier_prioritaire - code_qp",
  coalesce(quartier_prioritaire.in_zone, false) as "quartier_prioritaire - in_zone"

FROM bdnb_registre_2022 as batiment

left join lateral (
  select *
  from (
    select
      id_fcu,
      "Identifiant reseau" as id_sncu,
      "reseaux classes",
      round(reseau.geom <-> batiment.geom) as distance
    from reseaux_de_chaleur reseau
    order by reseau.geom <-> batiment.geom
    limit 1
  ) sub
  where distance < 1000
) as nearest_reseau_de_chaleur on true

left join lateral (
  select *
  from (
    select
      id_fcu,
      "Identifiant reseau" as id_sncu,
      round(reseau.geom <-> batiment.geom) as distance
    from reseaux_de_froid reseau
    order by reseau.geom <-> batiment.geom
    limit 1
  ) sub
  where distance < 1000
) as nearest_reseau_de_froid on true

left join lateral (
  select *
  from (
    select
      id_fcu,
      round(reseau.geom <-> batiment.geom) as distance
    from zones_et_reseaux_en_construction reseau
    where is_zone is false
    order by reseau.geom <-> batiment.geom
    limit 1
  ) sub
  where distance < 1000
) as nearest_reseau_en_construction on true

left join lateral (
  select *
  from (
    select
      id_fcu,
      st_intersects(reseau.geom, batiment.geom) as in_zone
      from zones_et_reseaux_en_construction reseau
    order by reseau.geom <-> batiment.geom
    limit 1
  ) sub
  where in_zone is true
) as zone_reseau_en_construction on true

left join lateral (
  select *
  from (
      select
        id_fcu,
        "Identifiant reseau" as id_sncu,
        st_intersects(pdp.geom, batiment.geom) as in_zone
      from zone_de_developpement_prioritaire pdp
      order by pdp.geom <-> batiment.geom
      limit 1
  ) sub
  where in_zone is true
) as perimetre_de_developpement_prioritaire on true

-- spécifique QPV
left join lateral (
  select *
  from (
      select
        code_qp,
        st_intersects(qp.geom, batiment.geom) as in_zone
      from data.quartiers_prioritaires qp
      order by qp.geom <-> batiment.geom
      limit 1
  ) sub
  where in_zone is true
) as quartier_prioritaire on true

-- accélère les traitements en ne prenant que les batiments intéressants
WHERE dpe_mix_arrete_type_installation_chauffage = '"'collectif'"'
  and (dpe_mix_arrete_type_energie_chauffage = '"'fioul'"' OR dpe_mix_arrete_type_energie_chauffage = '"'gaz'"')
  and quartier_prioritaire.code_qp is not null
'
