import { generateGeoJSONFromSQLQuery } from '@/modules/tiles/server/generation-strategies';
import type { AsTile } from '@/modules/tiles/server/tiles.config';
import type { ReseauxDeChaleur } from '@/server/db/kysely/database';

/**
 * Liste des champs émis dans les properties des tuiles RDC.
 *
 * Les `energie_ratio_*` ne sont pas des colonnes de la table `reseaux_de_chaleur`
 * mais des champs calculés dans la requête SQL ci-dessous (division par
 * `production_totale_MWh`). Le typage les distingue des colonnes Kysely.
 */
const energieRatioFields = [
  'energie_ratio_biomasse',
  'energie_ratio_geothermie',
  'energie_ratio_uve',
  'energie_ratio_chaleurIndustrielle',
  'energie_ratio_solaireThermique',
  'energie_ratio_pompeAChaleur',
  'energie_ratio_gaz',
  'energie_ratio_fioul',
] as const;
type EnergieRatioField = (typeof energieRatioFields)[number];

const reseauxDeChaleurFields = [
  'id_fcu',

  'Taux EnR&R',
  'Gestionnaire',
  'MO',
  'Identifiant reseau',
  'reseaux classes',
  'contenu CO2',
  'contenu CO2 ACV',
  'ecoreseau',
  'nom_reseau',
  'livraisons_totale_MWh',
  'nb_pdl',
  'has_trace',
  'PM',
  'annee_creation',
  'tags',
  'ouvert_aux_raccordements',
  ...energieRatioFields,
] as const satisfies readonly (keyof ReseauxDeChaleur | EnergieRatioField)[];

type ReseauxDeChaleurDbField = Exclude<(typeof reseauxDeChaleurFields)[number], EnergieRatioField>;
export type ReseauxDeChaleurTile = AsTile<Required<Pick<ReseauxDeChaleur, ReseauxDeChaleurDbField>>> & {
  [K in EnergieRatioField]: number | null;
};

export const reseauxDeChaleurGeoJSONQuery = generateGeoJSONFromSQLQuery(
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
        ${reseauxDeChaleurFields.map((field) => `'${field}', "${field}"`).join(',\n')}
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
