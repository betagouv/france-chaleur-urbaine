import { defineTilesConfig } from '@/modules/tiles/server/generation';
import {
  downloadGeoJSONFromURL,
  extractGeoJSONFromDatabaseTable,
  extractZippedShapefileToGeoJSON,
  fromSQLQuery,
  getInputFilePath,
} from '@/modules/tiles/server/generation-strategies';
import { ObjectKeys } from '@/utils/typescript';

const testsAdressesGeoJSONQuery = fromSQLQuery(
  `
SELECT json_build_object(
  'type', 'FeatureCollection',
  'features', json_agg(feature)
) as geojson
FROM (
  SELECT json_build_object(
    'id', row_number() OVER (),
    'type', 'Feature',
    'geometry', ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(ST_Centroid(ST_Collect(a.geom)), 4326)))::json,
    'properties', jsonb_build_object(
      'ban_address', a.ban_address,
      'tests', a.tests,
      'eligibility_status', a.eligibility_status,
      'isEligible', (a.eligibility_status->>'isEligible')::boolean
    )
  ) AS feature
  FROM (
    SELECT
      addr.ban_address,
      -- centroids will be merged later
      array_agg(addr.geom) AS geom,
      addr.eligibility_status,

      json_agg(
        DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.name,
          'created_at', t.created_at,
          'user', jsonb_build_object(
            'id', u.id,
            'role', u.role,
            'gestionnaires', u.gestionnaires,
            'first_name', u.first_name,
            'last_name', u.last_name,
            'structure_name', u.structure_name,
            'structure_type', u.structure_type,
            'phone', u.phone
          )
        )
      ) AS tests

    FROM pro_eligibility_tests_addresses addr
    LEFT JOIN pro_eligibility_tests t ON addr.test_id = t.id
    LEFT JOIN users u ON t.user_id = u.id

    WHERE addr.ban_address IS NOT NULL
    AND addr.ban_score > 60

    GROUP BY addr.ban_address, addr.eligibility_status

    UNION ALL

    SELECT
      addr.ban_address,
      -- centroids will be merged later
      array_agg(addr.geom) AS geom,
      addr.eligibility_status,

      json_agg(
        DISTINCT jsonb_build_object(
          'id', t.id,
          'name', t.id,
          'created_at', t.created_at,
          'user', jsonb_build_object(
            'id', COALESCE(u.id::text, t.email),
            'role', u.role,
            'gestionnaires', u.gestionnaires,
            'first_name', COALESCE(u.first_name, t.email),
            'last_name', COALESCE(u.last_name, ''),
            'structure_name', u.structure_name,
            'structure_type', u.structure_type,
            'phone', u.phone
          )
        )
      ) AS tests

    FROM eligibility_demands_addresses addr
    LEFT JOIN eligibility_demands t ON t.eligibility_test_id = addr.test_id
    LEFT JOIN users u ON t.email = u.email

    WHERE addr.ban_address IS NOT NULL
    AND addr.ban_score > 60

    GROUP BY addr.ban_address, addr.eligibility_status
  ) a
) features;
  `,
  ({ properties, ...feature }) => {
    const { tests, ...rest } = properties as any;

    const interestedUsers = tests.reduce((acc: any, { user, ...test }: any) => {
      acc[user.id] = acc[user.id] || {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        gestionnaires: user.gestionnaires,
        structure_name: user.structure_name,
        structure_type: user.structure_type,
        phone: user.phone,
        tests: [],
      };

      acc[user.id].tests.push(test);
      return acc;
    }, {} as any);

    return {
      ...feature,
      // TODO vérifier, car auparavant ...features.properties (vide)
      properties: { ...properties, nbUsers: Object.keys(interestedUsers).length, users: Object.values(interestedUsers), ...rest },
    };
  }
);
const reseauxDeChaleurGeoJSONQuery = fromSQLQuery(
  `
SELECT
  json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(feature)
  ) as geojson
FROM (
  SELECT
    json_build_object(
      'id', id_fcu,
      'type', 'Feature',
      'geometry', ST_AsGeoJSON(ST_ForcePolygonCCW(ST_Transform(geom, 4326)))::json,
      'properties', json_build_object(
        'id_fcu', "id_fcu",
        'Taux EnR&R', "Taux EnR&R",
        'Gestionnaire', "Gestionnaire",
        'Identifiant reseau', "Identifiant reseau",
        'reseaux classes', "reseaux classes",
        'contenu CO2', "contenu CO2",
        'contenu CO2 ACV', "contenu CO2 ACV",
        'nom_reseau', "nom_reseau",
        'livraisons_totale_MWh', "livraisons_totale_MWh",
        'nb_pdl', "nb_pdl",
        'has_trace', "has_trace",
        'PM', "PM",
        'annee_creation', "annee_creation",
        'energie_ratio_biomasse', "energie_ratio_biomasse",
        'energie_ratio_geothermie', "energie_ratio_geothermie",
        'energie_ratio_uve', "energie_ratio_uve",
        'energie_ratio_chaleurIndustrielle', "energie_ratio_chaleurIndustrielle",
        'energie_ratio_solaireThermique', "energie_ratio_solaireThermique",
        'energie_ratio_pompeAChaleur', "energie_ratio_pompeAChaleur",
        'energie_ratio_gaz', "energie_ratio_gaz",
        'energie_ratio_fioul', "energie_ratio_fioul",
        'tags', "tags"
      )
    ) AS feature
  FROM (
    SELECT
      *
    FROM (
      SELECT
        *,
        ("prod_MWh_biomasse_solide") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_biomasse",
        ("prod_MWh_geothermie") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_geothermie",
        ("prod_MWh_dechets_internes" + "prod_MWh_UIOM") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_uve",
        ("prod_MWh_chaleur_industiel") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_chaleurIndustrielle",
        ("prod_MWh_solaire_thermique") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_solaireThermique",
        ("prod_MWh_PAC") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_pompeAChaleur",
        ("prod_MWh_gaz_naturel") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_gaz",
        ("prod_MWh_fioul_domestique" + "prod_MWh_fioul_lourd") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_fioul",
        ("prod_MWh_autres_ENR") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_autresEnr",
        ("prod_MWh_chaudieres_electriques") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_chaufferiesElectriques",
        ("prod_MWh_charbon") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_charbon",
        ("prod_MWh_GPL") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_gpl",
        ("prod_MWh_autre_chaleur_recuperee") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_autreChaleurRecuperee",
        ("prod_MWh_biogaz") / COALESCE(NULLIF("production_totale_MWh", 0), 1) AS "energie_ratio_biogaz"
      FROM reseaux_de_chaleur rdc
    ) row
  ) row2
) features
  `
);

export const tilesConfigs = {
  'etudes-en-cours': defineTilesConfig({
    tilesTableName: 'etudes_en_cours_tiles',
    generateGeoJSON: extractGeoJSONFromDatabaseTable('etudes_en_cours'),
  }),
  'perimetres-geothermie-profonde': defineTilesConfig({
    tilesTableName: 'perimetres_geothermie_profonde_tiles',
    zoomMax: 11,
    // Attention, il faut avoir corrigé le format du fichier au préalable
    // sed -i 's/tableauFeature/Feature/g' gelules_geoth.geojson
    generateGeoJSON: getInputFilePath,
  }),
  'tests-adresses': defineTilesConfig({
    tilesTableName: 'tests_adresses_tiles',
    zoomMax: 12,
    tippeCanoeArgs: '--drop-rate=0 --no-tile-size-limit --no-feature-limit',
    generateGeoJSON: testsAdressesGeoJSONQuery,
  }),
  'reseaux-de-chaleur': defineTilesConfig({
    tilesTableName: 'reseaux_de_chaleur_tiles',
    tilesGenerationMethod: 'legacy',
    generateGeoJSON: reseauxDeChaleurGeoJSONQuery,
  }),
  'reseaux-de-froid': defineTilesConfig({
    tilesTableName: 'reseaux_de_froid_tiles',
    tilesGenerationMethod: 'legacy',
    generateGeoJSON: extractGeoJSONFromDatabaseTable('reseaux_de_froid'),
  }),
  'reseaux-en-construction': defineTilesConfig({
    tilesTableName: 'zones_et_reseaux_en_construction_tiles',
    tilesGenerationMethod: 'legacy',
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zones_et_reseaux_en_construction'),
  }),
  'perimetres-de-developpement-prioritaire': defineTilesConfig({
    tilesTableName: 'zone_de_developpement_prioritaire_tiles',
    tilesGenerationMethod: 'legacy',
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_de_developpement_prioritaire'),
  }),
  'installations-geothermie-surface-echangeurs-fermes': defineTilesConfig({
    tilesTableName: 'installations_geothermie_surface_echangeurs_fermes_tiles',
    zoomMax: 10,
    tippeCanoeArgs: '-r1.3',
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=vue_gthsurf_diff_install_sonde:vue_gthsurf_diff_install_sonde&outputFormat=application/json&srsName=EPSG:4326'
    ),
  }),
  'installations-geothermie-surface-echangeurs-ouverts': defineTilesConfig({
    tilesTableName: 'installations_geothermie_surface_echangeurs_ouverts_tiles',
    zoomMax: 10,
    tippeCanoeArgs: '-r1.3',
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=installation_geothermie_aquif:vue_gthsurf_diff_install_aquif&outputFormat=application/json&srsName=EPSG:4326'
    ),
  }),
  'ouvrages-geothermie-surface-echangeurs-fermes': defineTilesConfig({
    tilesTableName: 'ouvrages_geothermie_surface_echangeurs_fermes_tiles',
    zoomMax: 10,
    tippeCanoeArgs: '-r1.8',
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationPartClosedLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_sonde:vue_gthsurf_diff_ouvrage_sonde&outputFormat=application/json&srsName=EPSG:4326'
    ),
  }),
  'ouvrages-geothermie-surface-echangeurs-ouverts': defineTilesConfig({
    tilesTableName: 'ouvrages_geothermie_surface_echangeurs_ouverts_tiles',
    zoomMax: 10,
    tippeCanoeArgs: '-r1.3',
    // Source : https://www.geothermies.fr/outils/guides/services-web-cartographiques-des-installations-de-geothermie-de-surface-ademe-brgm
    generateGeoJSON: downloadGeoJSONFromURL(
      'https://data.geoscience.fr/api/geothermyInstallationPartOpenLoopWXS?service=wfs&version=2.0.0&request=GetFeature&typenames=ouvrage_geothermie_aquif:vue_gthsurf_diff_ouvrage_aquif&outputFormat=application/json&srsName=EPSG:4326'
    ),
  }),
  'zones-opportunite-froid': defineTilesConfig({
    tilesTableName: 'zone_a_potentiel_froid_tiles',
    zoomMax: 12,
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_a_potentiel_froid'),
  }),
  'zones-opportunite-fort-froid': defineTilesConfig({
    tilesTableName: 'zone_a_potentiel_fort_froid_tiles',
    zoomMax: 12,
    generateGeoJSON: extractGeoJSONFromDatabaseTable('zone_a_potentiel_fort_froid'),
  }),
  'zones-a-urbaniser': defineTilesConfig({
    tilesTableName: 'zone_a_urbaniser_tiles',
    zoomMax: 12,
    // Source : https://cerema.app.box.com/s/0jiohobsodkj2lnoplfoziz7hn5wgc0z
    generateGeoJSON: extractZippedShapefileToGeoJSON,
  }),
  'ressources-geothermales-nappes': defineTilesConfig({
    tilesTableName: 'zone_a_urbaniser_tiles',
    zoomMax: 12,
    // Source : https://drive.google.com/file/d/1w4lLWQCW1nMoRuIyZvVO5dMLMELo-YD3/view?usp=drive_link
    generateGeoJSON: extractZippedShapefileToGeoJSON,
  }),
};

export const tilesTypes = ObjectKeys(tilesConfigs);
export type TilesType = (typeof tilesTypes)[number];
