import type { DB, InsertObject } from '@/server/db/kysely';
import type { EligibilityType } from '@/server/services/addresseInformation';

type FeatureStyleProperties =
  | {
      fill?: string;
      'fill-opacity'?: number;
      stroke?: string;
      'stroke-opacity'?: number;
      'stroke-width'?: number;
    }
  | {
      'marker-color'?: string;
      'marker-size'?: string;
      'marker-symbol'?: string;
    };

type EntitiesProperties =
  | {
      type: 'test';
      expectedEligibilityType: EligibilityType;
    }
  | ({
      type: 'commune';
    } & InsertObject<DB, 'ign_communes'>)
  | ({
      type: 'departement';
    } & InsertObject<DB, 'ign_departements'>)
  | ({
      type: 'region';
    } & InsertObject<DB, 'ign_regions'>)
  | ({
      type: 'pdp';
    } & InsertObject<DB, 'zone_de_developpement_prioritaire'>)
  | ({
      type: 'reseauDeChaleur';
    } & InsertObject<DB, 'reseaux_de_chaleur'>)
  | ({
      type: 'reseauEnConstruction';
    } & InsertObject<DB, 'zones_et_reseaux_en_construction'>);

type EligibilityFixtureProperties = FeatureStyleProperties & EntitiesProperties;

/**
 * Données de test pour l'éligibilité au format GeoJSON
 * Pour visualiser et modifier les données sur geojson.io, exécutez la commande :
 * > pnpm cli test export-eligibility-fixtures
 */
export const eligibilityFixtures: GeoJSON.FeatureCollection<GeoJSON.Geometry, EligibilityFixtureProperties> = {
  features: [
    {
      geometry: {
        coordinates: [5.384840990270277, 43.329315304359625],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'reseau_existant_loin',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.399013730329045, 43.31711204690038],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'reseau_futur_loin',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [
            [5.363781772, 43.309087791],
            [5.349394914, 43.285778308],
            [5.402188079, 43.213995104],
            [5.509936954, 43.202133958],
            [5.52308696, 43.234889387],
            [5.505865156, 43.274513757],
            [5.53254336, 43.299507099],
            [5.47511938, 43.314682359],
            [5.45032878, 43.339271305],
            [5.445572905, 43.388429437],
            [5.379681698, 43.36973837],
            [5.332334319, 43.37146138],
            [5.363781772, 43.309087791],
          ],
        ],
        type: 'Polygon',
      },
      properties: {
        fill: '#555555',
        'fill-opacity': 0,
        insee_com: '13055',
        insee_dep: '13',
        insee_reg: '93',
        nom: 'Marseille',
        stroke: '#555555',
        'stroke-opacity': 1,
        'stroke-width': 2,
        type: 'commune',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [
            [5.618993610901896, 43.158549130317226],
            [5.7011996884995995, 43.68100094165595],
            [4.742128783193806, 43.93017599877055],
            [4.226974676486378, 43.466595573874145],
            [5.618993610901896, 43.158549130317226],
          ],
        ],
        type: 'Polygon',
      },
      properties: {
        insee_dep: '13',
        nom: 'Bouches-du-Rhône',
        type: 'departement',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [
            [4.216873277219065, 43.48755302385635],
            [6.289270668965941, 42.91283385420439],
            [7.87253078812671, 43.727552680949714],
            [6.527403288514819, 45.154236791497055],
            [4.216873277219065, 43.48755302385635],
          ],
        ],
        type: 'Polygon',
      },
      properties: {
        insee_reg: '93',
        nom: "Provence-Alpes-Côte d'Azur",
        type: 'region',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [
            [5.368973196455812, 43.31182538967256],
            [5.3848943258862505, 43.31182538967256],
            [5.3848943258862505, 43.319340072833455],
            [5.368973196455812, 43.319340072833455],
            [5.368973196455812, 43.31182538967256],
          ],
        ],
        type: 'Polygon',
      },
      properties: {
        fill: '#f0bb00',
        'fill-opacity': 0.47,
        id_fcu: 1,
        reseau_de_chaleur_ids: [1],
        reseau_en_construction_ids: [1],
        stroke: '#f0bb00',
        'stroke-opacity': 1,
        'stroke-width': 2,
        type: 'pdp',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [5.381236856651697, 43.318990630162745],
          [5.381245364220661, 43.31928154266268],
          [5.379799077547489, 43.31926916343579],
        ],
        type: 'LineString',
      },
      properties: {
        communes_insee: ['13055'],
        Gestionnaire: 'Gestionnaire',
        has_PDP: true,
        has_trace: true,
        'Identifiant reseau': '1301C',
        id_fcu: 1,
        nom_reseau: 'Réseau de chaleur PDP',
        ouvert_aux_raccordements: true,
        'reseaux classes': true,
        stroke: '#48A21A',
        'stroke-opacity': 1,
        'stroke-width': 2,
        tags: [],
        type: 'reseauDeChaleur',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [5.384755318634461, 43.322487498491],
          [5.384781857459075, 43.31995821722495],
          [5.382738367955454, 43.3199775251143],
        ],
        type: 'LineString',
      },
      properties: {
        communes_insee: ['13055'],
        Gestionnaire: 'Gestionnaire',
        has_PDP: false,
        has_trace: true,
        'Identifiant reseau': '1302C',
        id_fcu: 2,
        nom_reseau: 'Réseau de chaleur',
        ouvert_aux_raccordements: true,
        'reseaux classes': false,
        stroke: '#48A21A',
        'stroke-opacity': 1,
        'stroke-width': 2,
        tags: [],
        type: 'reseauDeChaleur',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.385674962979579, 43.31999130391564],
        type: 'Point',
      },
      properties: {
        communes_insee: ['13055'],
        has_PDP: false,
        has_trace: false,
        'Identifiant reseau': '1303C',
        id_fcu: 204,
        'marker-color': '#48a21a',
        'marker-size': 'medium',
        'marker-symbol': 'circle',
        ouvert_aux_raccordements: true,
        tags: [],
        type: 'reseauDeChaleur',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [5.385578006016516, 43.32028676537945],
          [5.385604512192344, 43.32312145235838],
          [5.389527426160953, 43.324027752944374],
        ],
        type: 'LineString',
      },
      properties: {
        communes_insee: ['13055'],
        has_PDP: false,
        has_trace: true,
        'Identifiant reseau': '1304C',
        id_fcu: 403,
        ouvert_aux_raccordements: false,
        stroke: '#48A21A',
        'stroke-opacity': 1,
        'stroke-width': 2,
        tags: [],
        type: 'reseauDeChaleur',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [5.384359134349523, 43.316663280020975],
          [5.384758990075056, 43.316663280020975],
          [5.384741974938521, 43.31537577143317],
        ],
        type: 'LineString',
      },
      properties: {
        gestionnaire: 'Gestionnaire',
        id_fcu: 1,
        is_zone: false,
        nom_reseau: 'Réseau en construction PDP',
        ouvert_aux_raccordements: true,
        stroke: '#DA5DD5',
        'stroke-opacity': 1,
        'stroke-width': 2,
        tags: [],
        type: 'reseauEnConstruction',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [
            [5.386603556659054, 43.32055760662212],
            [5.390139701577596, 43.32055760662212],
            [5.390139701577596, 43.3229198587257],
            [5.386603556659054, 43.3229198587257],
            [5.386603556659054, 43.32055760662212],
          ],
        ],
        type: 'Polygon',
      },
      properties: {
        fill: '#DA5DD5',
        'fill-opacity': 0.47,
        gestionnaire: 'Gestionnaire',
        id_fcu: 2,
        is_zone: true,
        nom_reseau: 'Réseau en construction',
        ouvert_aux_raccordements: true,
        stroke: '#DA5DD5',
        'stroke-opacity': 1,
        'stroke-width': 2,
        tags: [],
        type: 'reseauEnConstruction',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [5.385763793973325, 43.31706196432833],
          [5.38571071632407, 43.31932105343259],
          [5.3876215117033155, 43.319301745334656],
        ],
        type: 'LineString',
      },
      properties: {
        gestionnaire: 'Gestionnaire',
        id_fcu: 3,
        is_zone: false,
        nom_reseau: 'Réseau en construction',
        ouvert_aux_raccordements: true,
        stroke: '#DA5DD5',
        'stroke-opacity': 1,
        'stroke-width': 2,
        tags: [],
        type: 'reseauEnConstruction',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [
          [5.385957927865064, 43.31995250785792],
          [5.390463977694679, 43.31991393956406],
          [5.392169208316062, 43.32116096866625],
        ],
        type: 'LineString',
      },
      properties: {
        fill: '#DA5DD5',
        'fill-opacity': 0.47,
        id_fcu: 403,
        is_zone: false,
        ouvert_aux_raccordements: false,
        stroke: '#DA5DD5',
        'stroke-opacity': 1,
        'stroke-width': 2,
        tags: [],
        type: 'reseauEnConstruction',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.383894001263059, 43.3191912198659],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'dans_pdp_reseau_existant',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.38474682815351, 43.318550733148925],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'dans_pdp_reseau_futur',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.385355470995137, 43.320001018219756],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'reseau_existant_tres_proche',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.386160724149562, 43.319775459938484],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'reseau_futur_tres_proche',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.387003874863467, 43.320800307983916],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'dans_zone_reseau_futur',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.386348153298172, 43.32379814035667],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'reseau_existant_proche',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.38980100445178, 43.32001160358531],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'reseau_futur_proche',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.38473900690181, 43.35853659718589],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'dans_ville_reseau_existant_sans_trace',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
    {
      geometry: {
        coordinates: [5.372870920721596, 43.37900939761525],
        type: 'Point',
      },
      properties: {
        expectedEligibilityType: 'trop_eloigne',
        'marker-color': '#FF0000',
        'marker-size': 'medium',
        type: 'test',
      },
      type: 'Feature',
    },
  ],
  type: 'FeatureCollection',
};
