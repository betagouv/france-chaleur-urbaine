import { mapParam } from '@components/Map';
import geojsonvt from 'geojson-vt';
import db from 'src/db';

const debug = !!(process.env.API_DEBUG_MODE || null);

const getObjectIndex = async (table: string, tileOptions, properties) => {
  const geoJSON = await db(table)
    .first(
      db.raw(
        `
      json_build_object(
        'type', 'FeatureCollection',
        'features', json_agg(json_build_object(
          'type', 'Feature',
          'geometry', ST_AsGeoJSON(ST_Transform(geom,4326))::json,
          'properties', json_build_object(
            ${properties
              .flatMap((property) => [`'${property}'`, property])
              .join(',')}
          )
          ))
        )
          `
      )
    )
    .whereNotNull('geom');
  return geojsonvt(geoJSON.json_build_object, tileOptions);
};

const { maxZoom, minZoomData } = mapParam;
const allTiles = {};

const tilesInfo = {
  network: {
    table: 'potentiel_rcu — l_traces_rdch_l_r11_2022_05_new',
    options: {
      maxZoom,
      tolerance: 0,
    },
    properties: ['id'],
  },
  energy: {
    table: 'potentiel_rcu — registre_copro_r11_220125',
    options: {
      minZoom: minZoomData,
      maxZoom,
    },
    properties: [
      'id',
      'epci',
      'commune',
      'numero_immatriculation',
      'type_syndic',
      'administration_provisioire',
      'syndic_provisoire',
      'identification_representant_legal',
      'code_ape',
      'commune_representant_legal',
      'mandat',
      'date_fin_mandat',
      'nom_usage_copropriete',
      'adresse_reference',
      'adresse_complementaire_1',
      'adresse_complementaire_2',
      'adresse_complementaire_3',
      'nb_adresse_complementaire',
      'code_insee',
      'prefixe',
      'section',
      'parcelle',
      'code_insee_1',
      'prefixe_1',
      'section_1',
      'parcelle_1',
      'code_insee_2',
      'prefixe_2',
      'section_2',
      'parcelle_2',
      'nb_parcelle',
      'date_reglement_copropriete',
      'residence_service',
      'syndicat_cooperatif',
      'syndic_principal_secondaire',
      'numero_identification_syndicat_principal',
      'nb_asl',
      'nb_aful',
      'nb_union_syndic',
      'nb_lot',
      'nb_lot_habitation_bureau_commerce',
      'nb_lot_habitation',
      'nb_lot_stationnement',
      'nb_arrete_code_sante_publique',
      'nb_arrete_peril',
      'nb_arrete_equipement',
      'mandat_ad_hoc',
      'ordonnance_carence',
      'premier_exercice_comptable',
      'date_debut_exercice_compable',
      'date_fin_exercice_compable',
      'date_assemblee_generale_comptes',
      'charges_courantes',
      'charges_eceptionnelles',
      'montant_dette_remuneration_autre',
      'montant_du_coproprietaire',
      'nb_coproprietaire_debiteur_sup300',
      'montant_fonds_travaux',
      'presence_personnel',
      'periode_construction',
      'annee_achevement_construction',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'non_determine',
      'type_chauffage',
      'chauffage_urbain',
      'energie_utilisee',
      'nb_ascenceur',
      'identifiant_ign',
    ],
  },
  gas: {
    table: 'potentiel_rcu — conso_gaz_2020_r11_geocoded',
    options: {
      minZoom: minZoomData,
      maxZoom,
    },
    properties: [
      'id',
      'operateur',
      'code_eic',
      'annee',
      'filiere',
      'iris_code',
      'iris_libelle',
      'adresse',
      'code_insee',
      'nom_commune',
      'code_grand_secteur',
      'conso',
      'pdl',
      'latitude',
      'longitude',
      'result_label',
      'result_score',
      'result_type',
      'result_id',
      'result_housenumber',
      'result_name',
      'result_street',
      'result_postcode',
      'result_city',
      'result_context',
      'result_citycode',
      'result_oldcitycode',
      'result_oldcity',
      'result_district',
    ],
  },
};

Object.entries(tilesInfo)
  .filter(
    ([key]) =>
      !process.env.IGNORE_TILES || !process.env.IGNORE_TILES.includes(key)
  )
  .forEach(([key, { table, options, properties }]) => {
    debug && console.info(`Indexing tiles for ${key} with ${table}...`);
    getObjectIndex(table, options, properties).then((result) => {
      allTiles[key] = result;
      debug && console.info(`Indexing tiles for ${key} with ${table} done`);
    });
  });

const getTiles = (
  key: 'network' | 'gas' | 'energy',
  x: number,
  y: number,
  z: number
) => {
  const tiles = allTiles[key];
  if (!tiles) {
    return null;
  }

  const tileInfo = tilesInfo[key];
  return tileInfo.options.minZoom && tileInfo.options.minZoom > z
    ? null
    : tiles.getTile(z, x, y);
};

export default getTiles;
