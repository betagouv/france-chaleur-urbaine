import { unlink, writeFile } from 'fs/promises';

import { kdb, sql } from '@/server/db/kysely';

import { BaseAdapter } from '../base';

export default class ReseauxDeChaleurAdapter extends BaseAdapter {
  public databaseName = 'reseaux_de_chaleur';

  async generateGeoJSON(filepath?: string) {
    const filepathToExport = filepath || `/tmp/${this.databaseName}.geojson`;
    await unlink(filepathToExport);

    const result = await sql<any>`
SELECT
  json_build_object(
    'type', 'FeatureCollection',
    'features', json_agg(feature)
  )
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
        'energie_ratio_fioul', "energie_ratio_fioul"
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
    `.execute(kdb);

    const geojson = result.rows[0].json_build_object;

    await writeFile(filepathToExport, JSON.stringify(geojson));

    return filepathToExport;
  }
}
