#!/bin/bash -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR"/lib.sh

# Décommenter pour écrire dans un fichier en plus de la sortie standard
# exec &> >(tee bdnb-batiments.log)

# Construit une table bdnb_batiments avec les données intéressantes pour FCU
split_table_query bdnb_batiments id 50000 32300000 "
SELECT
  bg.id, -- sera utilisé pour découper pour obtenir des geojson
  bg.batiment_groupe_id,
  bg.geom_groupe as geom,
  bg.code_commune_insee,
  
  -- Adresse principale
  bga.cle_interop_adr_principale_ban as adresse_cle_interop_adr_principale_ban,
  bga.libelle_adr_principale_ban as adresse_libelle_adr_principale_ban,
  
  -- Informations FFO
  ffo.nb_log as ffo_bat_nb_log,
  ffo.annee_construction as ffo_bat_annee_construction,
  ffo.usage_niveau_1_txt as ffo_bat_usage_niveau_1_txt,

  -- Consommation électrique
  elec.conso_pro as dle_elec_multimillesime_conso_pro,
  elec.conso_res as dle_elec_multimillesime_conso_res,
  elec.conso_tot as dle_elec_multimillesime_conso_tot,

  -- Consommation gaz
  gaz.conso_pro as dle_gaz_multimillesime_conso_pro,
  gaz.conso_res as dle_gaz_multimillesime_conso_res,
  gaz.conso_tot as dle_gaz_multimillesime_conso_tot,

  -- Consommation réseaux
  reseaux.conso_pro as dle_reseaux_multimillesime_conso_pro,
  reseaux.conso_res as dle_reseaux_multimillesime_conso_res,
  reseaux.conso_tot as dle_reseaux_multimillesime_conso_tot,
  reseaux.type_reseau as dle_reseaux_multimillesime_type_reseau,

  -- RNC
  -- rnc.nb_log as rnc_nb_log,
  -- rnc.l_annee_construction as rnc_l_annee_construction,
  rnc.l_nom_copro as rnc_l_nom_copro,

  -- RPLS
  -- rpls.nb_log as rpls_nb_log,
  -- rpls.classe_ener_principale as rpls_classe_ener_principale,
  -- rpls.classe_ges_principale as rpls_classe_ges_principale,
  -- rpls.l_annee_construction as rpls_l_annee_construction,
  -- rpls.type_construction as rpls_type_construction,

  -- DPE représentatif
  dpe.classe_bilan_dpe as dpe_representatif_logement_classe_bilan_dpe,
  dpe.classe_emission_ges as dpe_representatif_logement_classe_emission_ges,
  -- dpe.type_generateur_ecs as dpe_representatif_logement_type_generateur_ecs,
  -- dpe.type_installation_ecs as dpe_representatif_logement_type_installation_ecs,
  dpe.type_energie_chauffage as dpe_representatif_logement_type_energie_chauffage,
  dpe.type_batiment_dpe as dpe_representatif_logement_type_batiment_dpe,
  dpe.type_dpe as dpe_representatif_logement_type_dpe,
  dpe.type_generateur_chauffage as dpe_representatif_logement_type_generateur_chauffage,
  dpe.surface_habitable_immeuble as dpe_representatif_logement_surface_habitable_immeuble,
  -- dpe.surface_habitable_logement as dpe_representatif_logement_surface_habitable_logement,
  dpe.type_installation_chauffage as dpe_representatif_logement_type_installation_chauffage,

  -- BDTopo
  -- bdtopo.l_nature as bdtopo_bat_l_nature,
  -- bdtopo.l_usage_1 as bdtopo_bat_l_usage_1,

  -- Synthese propriété usage
  synthese.usage_principal_bdnb_open as synthese_propriete_usage,

  -- Construction IDs et RNB IDs
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'construction_id', bc.batiment_construction_id,
        'rnb_id', rnb.rnb_id
      )
    )
    FROM bdnb_2024_10_a_open_data.batiment_construction bc
    LEFT JOIN bdnb_2024_10_a_open_data.rel_batiment_construction_rnb rnb ON rnb.batiment_construction_id = bc.batiment_construction_id
    WHERE bc.batiment_groupe_id = bg.batiment_groupe_id
  ) as constructions

FROM bdnb_2024_10_a_open_data.batiment_groupe AS bg
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_adresse bga ON bga.batiment_groupe_id = bg.batiment_groupe_id
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_ffo_bat ffo ON ffo.batiment_groupe_id = bg.batiment_groupe_id
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_dle_elec_multimillesime elec ON elec.batiment_groupe_id = bg.batiment_groupe_id AND elec.millesime = '2023'
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_dle_gaz_multimillesime gaz ON gaz.batiment_groupe_id = bg.batiment_groupe_id AND gaz.millesime = '2022' -- car non dispo pour 2023
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_dle_reseaux_multimillesime reseaux ON reseaux.batiment_groupe_id = bg.batiment_groupe_id AND reseaux.millesime = '2023'
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_rnc rnc ON rnc.batiment_groupe_id = bg.batiment_groupe_id
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_rpls rpls ON rpls.batiment_groupe_id = bg.batiment_groupe_id
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_dpe_representatif_logement dpe ON dpe.batiment_groupe_id = bg.batiment_groupe_id
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_bdtopo_bat bdtopo ON bdtopo.batiment_groupe_id = bg.batiment_groupe_id
LEFT JOIN bdnb_2024_10_a_open_data.batiment_groupe_synthese_propriete_usage synthese ON synthese.batiment_groupe_id = bg.batiment_groupe_id
WHERE contient_fictive_geom_groupe is false -- supprime toutes les geom hexagones
  AND true -- WHERE obligatoire pour split_table_query
"

echo -e "\nReste à faire : 
- créer les indexes :

CREATE INDEX CONCURRENTLY bdnb_batiments_id_idx ON bdnb_batiments(id);
CREATE INDEX CONCURRENTLY bdnb_batiments_batiment_groupe_id_idx ON bdnb_batiments(batiment_groupe_id);
CREATE INDEX CONCURRENTLY bdnb_batiments_geom_idx ON bdnb_batiments USING gist (geom);

- générer les tuiles :

pnpm cli tiles generate bdnb-batiments
"
