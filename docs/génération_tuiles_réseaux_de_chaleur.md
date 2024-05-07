# Génération des tuiles des réseaux de chaleur

Processus légèrement différent du fill-tiles classique étant donné qu'on a besoin de précalculer certaines données.

```sh
# générer un fichier geojson depuis la table reseaux_de_chaleur
psql postgres://postgres:postgres_fcu@localhost:5432/postgres -c "COPY (
    SELECT jsonb_build_object(
        'type',     'FeatureCollection',
        'features', jsonb_agg(feature)
    )
    FROM (
        SELECT jsonb_build_object(
            'id',         id_fcu,
            'type',       'Feature',
            'geometry',   ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(geom,4326)))::jsonb,
            'properties', json_build_object(
              'id_fcu', \"id_fcu\",
              'Taux EnR&R', \"Taux EnR&R\",
              'Gestionnaire', \"Gestionnaire\",
              'Identifiant reseau', \"Identifiant reseau\",
              'reseaux classes', \"reseaux classes\",
              'contenu CO2 ACV', \"contenu CO2 ACV\",
              'nom_reseau', \"nom_reseau\",
              'livraisons_totale_MWh', \"livraisons_totale_MWh\",
              'nb_pdl', \"nb_pdl\",
              'has_trace', \"has_trace\",
              'PM', \"PM\",
              'annee_creation', \"annee_creation\",
              'energie_ratio_biomasse', \"energie_ratio_biomasse\",
              'energie_ratio_geothermie', \"energie_ratio_geothermie\",
              'energie_ratio_uve', \"energie_ratio_uve\",
              'energie_ratio_chaleurIndustrielle', \"energie_ratio_chaleurIndustrielle\",
              'energie_ratio_solaireThermique', \"energie_ratio_solaireThermique\",
              'energie_ratio_pompeAChaleur', \"energie_ratio_pompeAChaleur\",
              'energie_ratio_gaz', \"energie_ratio_gaz\",
              'energie_ratio_fioul', \"energie_ratio_fioul\",
              'energie_majoritaire', CASE
                  WHEN energie_max_ratio = \"energie_ratio_biomasse\" THEN 'biomasse'
                  WHEN energie_max_ratio = \"energie_ratio_geothermie\" THEN 'geothermie'
                  WHEN energie_max_ratio = \"energie_ratio_uve\" THEN 'uve'
                  WHEN energie_max_ratio = \"energie_ratio_chaleurIndustrielle\" THEN 'chaleurIndustrielle'
                  WHEN energie_max_ratio = \"energie_ratio_solaireThermique\" THEN 'solaireThermique'
                  WHEN energie_max_ratio = \"energie_ratio_pompeAChaleur\" THEN 'pompeAChaleur'
                  WHEN energie_max_ratio = \"energie_ratio_gaz\" THEN 'gaz'
                  WHEN energie_max_ratio = \"energie_ratio_fioul\" THEN 'fioul'
                  WHEN energie_max_ratio = \"energie_ratio_autresEnr\" THEN 'autresEnr'
                  WHEN energie_max_ratio = \"energie_ratio_chaufferiesElectriques\" THEN 'chaufferiesElectriques'
                  WHEN energie_max_ratio = \"energie_ratio_charbon\" THEN 'charbon'
                  WHEN energie_max_ratio = \"energie_ratio_gpl\" THEN 'gpl'
                  WHEN energie_max_ratio = \"energie_ratio_autreChaleurRecuperee\" THEN 'autreChaleurRecuperee'
                  WHEN energie_max_ratio = \"energie_ratio_biogaz\" THEN 'biogaz'
                  ELSE NULL
                END
            )
        ) AS feature
        FROM (
          SELECT
            *,
            greatest(
              \"energie_ratio_biomasse\",
              \"energie_ratio_geothermie\",
              \"energie_ratio_uve\",
              \"energie_ratio_chaleurIndustrielle\",
              \"energie_ratio_solaireThermique\",
              \"energie_ratio_pompeAChaleur\",
              \"energie_ratio_gaz\",
              \"energie_ratio_fioul\",
              \"energie_ratio_autresEnr\",
              \"energie_ratio_chaufferiesElectriques\",
              \"energie_ratio_charbon\",
              \"energie_ratio_gpl\",
              \"energie_ratio_autreChaleurRecuperee\",
              \"energie_ratio_biogaz\"
            ) as \"energie_max_ratio\"
          FROM (
            SELECT
              *,
              (\"prod_MWh_biomasse_solide\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_biomasse\",
              (\"prod_MWh_geothermie\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_geothermie\",
              (\"prod_MWh_dechets_internes\" + \"prod_MWh_UIOM\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_uve\",
              (\"prod_MWh_chaleur_industiel\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_chaleurIndustrielle\",
              (\"prod_MWh_solaire_thermique\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_solaireThermique\",
              (\"prod_MWh_PAC\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_pompeAChaleur\",
              (\"prod_MWh_gaz_naturel\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_gaz\",
              (\"prod_MWh_fioul_domestique\" + \"prod_MWh_fioul_lourd\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_fioul\",
              (\"prod_MWh_autres_ENR\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_autresEnr\",
              (\"prod_MWh_chaudieres_electriques\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_chaufferiesElectriques\",
              (\"prod_MWh_charbon\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_charbon\",
              (\"prod_MWh_GPL\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_gpl\",
              (\"prod_MWh_autre_chaleur_recuperee\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_autreChaleurRecuperee\",
              (\"prod_MWh_biogaz\") / COALESCE(NULLIF(\"production_totale_MWh\", 0), 1) as \"energie_ratio_biogaz\"
            FROM reseaux_de_chaleur rdc
          ) row
        ) row2
    ) features
) TO STDOUT" | sed -e 's/\\\\"/\\"/g' > reseaux_de_chaleur.geojson

# générer les tuiles à partir du fichier geojson
yarn cli generate-tiles-from-file reseaux_de_chaleur.geojson reseaux_de_chaleur_tiles

# synchronisation avec la BDD de dev ou prod
./scripts/copyLocalTableToRemote.sh dev reseaux_de_chaleur_tiles --data-only
# ./scripts/copyLocalTableToRemote.sh prod reseaux_de_chaleur_tiles --data-only
```
