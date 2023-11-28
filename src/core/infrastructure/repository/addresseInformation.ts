import db from 'src/db';
import { CityNetwork, HeatNetwork } from 'src/types/HeatNetworksResponse';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import XLSX from 'xlsx';
import isInZDP from './zdp';

const hasNetworkInCity = async (city: string): Promise<boolean> => {
  const result = await db('reseaux_de_chaleur')
    .whereRaw('? = any(communes)', [city])
    .first();
  return !!result;
};
const hasFuturNetworkInCity = async (city: string): Promise<boolean> => {
  const result = await db('zones_et_reseaux_en_construction')
    .whereRaw('? = any(communes)', [city])
    .first();
  return !!result;
};

const isOnAnIRISNetwork = async (
  lat: number,
  lon: number
): Promise<boolean> => {
  const result = await db('network_iris')
    .where(
      db.raw(`ST_INTERSECTS(
      ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
      ST_Transform(geom, 2154)
    )
  `)
    )
    .first();

  return !!result;
};

export const closestNetwork = async (
  lat: number,
  lon: number
): Promise<{
  distance: number;
  'Identifiant reseau': string;
  'Taux EnR&R': number;
  'contenu CO2 ACV': number;
  Gestionnaire: string;
  nom_reseau: string;
}> => {
  const network = await db('reseaux_de_chaleur')
    .select(
      db.raw(
        `ST_Distance(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_Transform(geom, 2154)
        ) as distance, "Identifiant reseau", "Taux EnR&R", "contenu CO2 ACV", "Gestionnaire", nom_reseau`
      )
    )
    .where('has_trace', true)
    .orderBy('distance')
    .first();

  return network;
};

const closestFuturNetwork = async (
  lat: number,
  lon: number
): Promise<{
  distance: number;
  gestionnaire: string;
}> => {
  const network = await db('zones_et_reseaux_en_construction')
    .select(
      db.raw(
        `ST_Distance(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_Transform(geom, 2154)
        ) as distance, "gestionnaire"`
      )
    )
    .where('is_zone', false)
    .orderBy('distance')
    .first();

  return network;
};
const closestInFuturNetwork = async (
  lat: number,
  lon: number
): Promise<{
  gestionnaire: string;
}> => {
  const network = await db('zones_et_reseaux_en_construction')
    .where(
      db.raw(`ST_INTERSECTS(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_Transform(geom, 2154)
        )
      `)
    )
    .andWhere('is_zone', true)
    .first();

  return network;
};

export const getConso = async (
  lat: number,
  lon: number
): Promise<{ conso_nb: number; rownum: string } | null> => {
  const result = await db('donnees_de_consos')
    .select('rownum', 'conso_nb')
    .where(
      db.raw(`
        ST_INTERSECTS(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_BUFFER(ST_Transform(geom, 2154), 3.5)
        )
      `)
    )
    .first();
  return result;
};

export const getConsoById = async (
  id: string
): Promise<{ conso_nb: number; rownum: string } | null> => {
  const result = await db('donnees_de_consos')
    .select('rownum', 'conso_nb')
    .where('rownum', id)
    .first();
  return result;
};

export const getNbLogement = async (
  lat: number,
  lon: number
): Promise<{ nb_logements: number; fid: string } | null> => {
  const region = await db('regions')
    .select('bnb_nom')
    .where(
      db.raw(`
      ST_Intersects(
        ST_Transform(geom, 2154),
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154)
        )
    `)
    )
    .first();
  const result = await db(region.bnb_nom)
    .select(
      'fid',
      db.raw(`
        CASE
          WHEN cerffo2020_nb_log ISNULL 
            THEN anarnc202012_nb_log
          WHEN cerffo2020_nb_log < 1 
            THEN anarnc202012_nb_log
          ELSE cerffo2020_nb_log
        END as nb_logements
      `)
    )
    .where(
      db.raw(`
        ST_INTERSECTS(
          ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
          ST_BUFFER(ST_Transform(geom_adresse, 2154), 3.5)
        )
      `)
    )
    .first();
  return result;
};

export const getNbLogementById = async (
  id: string,
  lat: number,
  lon: number
): Promise<{ nb_logements: number; fid: string } | null> => {
  const region = await db('regions')
    .select('bnb_nom')
    .where(
      db.raw(`
      ST_Intersects(
        ST_Transform(geom, 2154),
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154)
        )
    `)
    )
    .first();

  const result = await db(region.bnb_nom)
    .select(
      'fid',
      db.raw(`
        CASE
          WHEN cerffo2020_nb_log ISNULL 
            THEN anarnc202012_nb_log
          WHEN cerffo2020_nb_log < 1 
            THEN anarnc202012_nb_log
          ELSE cerffo2020_nb_log
        END as nb_logements
      `)
    )
    .where('fid', id)
    .first();
  return result;
};

const headers = [
  'Adresse',
  'Adresse testée',
  "Indice de fiabilité de l'adresse testée",
  'Bâtiment potentiellement raccordable à un réseau existant',
  'Distance au réseau (m) si < 1000 m',
  "Tracé non disponible mais présence d'un réseau dans la zone",
  'PDP (périmètre de développement prioritaire)',
  'Bâtiment potentiellement raccordable à un réseau en construction',
  'Identifiant du réseau le plus proche',
  'Taux EnR&R du réseau le plus proche',
  'Contenu CO2 ACV (g/kWh)',
];

const legend = [
  ['Adresse', 'Adresse reçue par France Chaleur Urbaine'],
  ['Adresse testée', 'Adresse testée par France Chaleur Urbaine'],
  [
    "Indice de fiabilité de l'adresse testée",
    "Min = 0 , Max = 1, Cet indice traduit la correspondance entre l'adresse renseignée par l'utilisateur et celle effectivement testée",
  ],
  [
    'Bâtiment potentiellement raccordable à un réseau existant',
    "Résultat compilant distance au réseau et présence d'un réseau dans la zone",
  ],
  ['Distance au réseau (m) si < 1000 m', 'Distance au réseau le plus proche'],
  [
    "Tracé non disponible mais présence d'un réseau dans la zone",
    "Lorsque nous ne disposons pas de tracé d'un réseau à proximité de l'adresse testée, nous vérifions s'il existe une consommation de chaleur sur un réseau dans le quartier (données à l'iris mise à disposition par le MTE). Le cas échéant, c'est qu'il existe un réseau à proximité",
  ],
  [
    'PDP (périmètre de développement prioritaire)',
    "Si l'adresse est comprise dans un PDP, son raccordement peut être obligatoire (valable pour les nouveaux bâtiments ou ceux renouvelant leur installation de chauffage au-dessus d'une certaine puissance)",
  ],
  [
    'Bâtiment potentiellement raccordable à un réseau en construction',
    'Le bâtiment est à moins de 100 m du tracé d’un réseau en construction, ou situé dans une zone sur laquelle nous avons connaissance d’un réseau en construction ou en cours de mise en service (voir carte pour visualiser les zones)',
  ],
  ['Identifiant du réseau le plus proche', 'Identifiant réseau national'],
  [
    'Taux EnR&R du réseau le plus proche',
    'Taux d’énergies renouvelables et de récupération issu de l’arrêté DPE du 16 mars 2023 (https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047329716)',
  ],
  [
    'Contenu CO2 ACV (g/kWh)',
    'Contenu CO2 en analyse du cycle de vie issu de l’arrêté DPE du 16 mars 2023 (https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047329716)',
  ],
];

export const getExport = (addresses: any[]) => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(
    [headers].concat(
      addresses.map((address) => [
        address.address,
        address.label,
        address.score,
        address.isEligible && !address.futurNetwork ? 'Oui' : 'Non',
        address.distance,
        address.isEligible && address.isBasedOnIris ? 'Oui' : 'Non',
        address.inZDP ? 'Oui' : 'Non',
        address.isEligible && address.futurNetwork ? 'Oui' : 'Non',
        address.id,
        address.tauxENRR,
        address.co2 ? Math.round(address.co2 * 1000) : null,
      ])
    )
  );
  XLSX.utils.book_append_sheet(wb, ws, 'Résultats');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(legend), 'Légende');
  return XLSX.write(wb, { bookType: EXPORT_FORMAT.XLSX, type: 'base64' });
};

const isEligible = (distance: number, city?: string) => {
  if (city && city.toLowerCase() === 'paris') {
    return { isEligible: distance <= 100, veryEligibleDistance: 60 };
  }
  return { isEligible: distance <= 200, veryEligibleDistance: 100 };
};

export const getCityEligilityStatus = async (
  city: string
): Promise<CityNetwork> => {
  const [cityHasNetwork, cityHasFuturNetwork] = await Promise.all([
    hasNetworkInCity(city),
    hasFuturNetworkInCity(city),
  ]);
  return { basedOnCity: true, cityHasNetwork, cityHasFuturNetwork };
};

export const getEligilityStatus = async (
  lat: number,
  lon: number,
  city?: string
): Promise<HeatNetwork> => {
  const [inZDP, irisNetwork, inFuturNetwork, futurNetwork, network] =
    await Promise.all([
      isInZDP(lat, lon),
      isOnAnIRISNetwork(lat, lon),
      closestInFuturNetwork(lat, lon),
      closestFuturNetwork(lat, lon),
      closestNetwork(lat, lon),
    ]);

  const eligibility = isEligible(Number(network.distance), city);
  const futurEligibility = isEligible(Number(futurNetwork.distance), city);
  if (
    eligibility.isEligible &&
    Number(network.distance) < eligibility.veryEligibleDistance
  ) {
    return {
      ...eligibility,
      distance: Math.round(network.distance),
      inZDP,
      isBasedOnIris: false,
      futurNetwork: false,
      id: network['Identifiant reseau'],
      tauxENRR: network['Taux EnR&R'],
      co2: network['contenu CO2 ACV'],
      gestionnaire: network['Gestionnaire'],
    };
  }
  if (
    futurEligibility.isEligible &&
    Number(futurNetwork.distance) < futurEligibility.veryEligibleDistance
  ) {
    return {
      ...futurEligibility,
      distance: Math.round(futurNetwork.distance),
      inZDP,
      isBasedOnIris: false,
      futurNetwork: true,
      id: null,
      tauxENRR: null,
      co2: null,
      gestionnaire: futurNetwork.gestionnaire,
    };
  }

  if (inFuturNetwork) {
    return {
      isEligible: true,
      distance: null,
      veryEligibleDistance: null,
      inZDP,
      isBasedOnIris: false,
      futurNetwork: true,
      id: null,
      tauxENRR: null,
      co2: null,
      gestionnaire: inFuturNetwork.gestionnaire,
    };
  }

  if (Number(network.distance) < 1000) {
    return {
      ...eligibility,
      distance: Math.round(network.distance),
      inZDP,
      isBasedOnIris: false,
      futurNetwork: false,
      id: network['Identifiant reseau'],
      tauxENRR: network['Taux EnR&R'],
      co2: network['contenu CO2 ACV'],
      gestionnaire: network['Gestionnaire'],
    };
  }

  if (Number(futurNetwork.distance) < 1000) {
    return {
      ...futurEligibility,
      distance: Math.round(futurNetwork.distance),
      inZDP,
      isBasedOnIris: false,
      futurNetwork: true,
      id: null,
      tauxENRR: null,
      co2: null,
      gestionnaire: futurNetwork.gestionnaire,
    };
  }

  return {
    isEligible: irisNetwork,
    distance: null,
    veryEligibleDistance: null,
    inZDP,
    isBasedOnIris: true,
    futurNetwork: false,
    id: null,
    tauxENRR: null,
    co2: null,
    gestionnaire: null,
  };
};
