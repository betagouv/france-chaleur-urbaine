import XLSX from 'xlsx';

import db from 'src/db';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { CityNetwork, HeatNetwork } from 'src/types/HeatNetworksResponse';

import isInPDP from './pdp';

const hasNetworkInCity = async (city: string): Promise<boolean> => {
  const result = await db('reseaux_de_chaleur').whereRaw('? = any(communes)', [city]).first();
  return !!result;
};
const hasFuturNetworkInCity = async (city: string): Promise<boolean> => {
  const result = await db('zones_et_reseaux_en_construction').whereRaw('? = any(communes)', [city]).first();
  return !!result;
};

export type NetworkInfos = {
  distance: number;
  'Identifiant reseau': string;
  'Taux EnR&R': number;
  'contenu CO2 ACV': number;
  Gestionnaire: string;
  nom_reseau: string;
  'reseaux classes': boolean;
  has_PDP: boolean;
};

const getNoTraceNetworkInCity = async (city: string): Promise<NetworkInfos> => {
  const result = await db('reseaux_de_chaleur')
    .select('Identifiant reseau', 'Taux EnR&R', 'contenu CO2 ACV', 'Gestionnaire', 'nom_reseau')
    .where('has_trace', false)
    .andWhereRaw('? = any(communes)', [city])
    .first();
  return result;
};

export const getDistanceToNetwork = async (networkId: string, lat: number, lon: number): Promise<NetworkInfos> => {
  const network = (await db('reseaux_de_chaleur')
    .select(
      'Identifiant reseau',
      'Taux EnR&R',
      'contenu CO2 ACV',
      'Gestionnaire',
      'nom_reseau',
      db.raw(`round(geom <-> ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154)) as distance`)
    )
    .where('has_trace', true)
    .andWhere('Identifiant reseau', networkId)
    .first()) as NetworkInfos;

  if (!network) {
    throw new Error(`Le réseau ${networkId} n'existe pas ou n'a pas de tracé`);
  }

  return network;
};

export const closestNetwork = async (lat: number, lon: number): Promise<NetworkInfos> => {
  const network = await db('reseaux_de_chaleur')
    .select(
      'Identifiant reseau',
      'Taux EnR&R',
      'contenu CO2 ACV',
      'Gestionnaire',
      'nom_reseau',
      'reseaux classes',
      'has_PDP',
      db.raw(`round(geom <-> ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154)) as distance`)
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
    .select(db.raw(`round(geom <-> ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154)) as distance, "gestionnaire"`))
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

export const getConso = async (lat: number, lon: number): Promise<{ conso_nb: number; rownum: string } | null> => {
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

export const getConsoById = async (id: string): Promise<{ conso_nb: number; rownum: string } | null> => {
  const result = await db('donnees_de_consos').select('rownum', 'conso_nb').where('rownum', id).first();
  return result;
};

export const getNbLogement = async (lat: number, lon: number): Promise<{ nb_logements: number; id: string } | null> => {
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
    .select('id', 'ffo_bat_nb_log as nb_logements')
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

export const getNbLogementById = async (id: string, lat: number, lon: number): Promise<{ nb_logements: number; id: string } | null> => {
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

  const result = await db(region.bnb_nom).select('id', 'ffo_bat_nb_log as nb_logements').where('id', id).first();
  return result;
};

const headers = [
  'Adresse',
  'Adresse testée',
  "Indice de fiabilité de l'adresse testée",
  'Bâtiment potentiellement raccordable à un réseau existant',
  'Distance au réseau (m) si < 1000 m',
  'PDP (périmètre de développement prioritaire)',
  'Bâtiment potentiellement raccordable à un réseau en construction',
  'Identifiant du réseau le plus proche',
  'Taux EnR&R du réseau le plus proche',
  'Contenu CO2 ACV (g/kWh)',
  'Présence d’un réseau non localisé sur la commune',
];

const legend = [
  ['Adresse', 'Adresse reçue par France Chaleur Urbaine'],
  ['Adresse testée', "Adresse testée par France Chaleur Urbaine (correspondance avec la Base d'adresse nationale)"],
  [
    "Indice de fiabilité de l'adresse testée",
    "Min = 0 , Max = 1. Cet indice traduit la correspondance entre l'adresse renseignée par l'utilisateur et celle effectivement testée",
  ],
  [
    'Bâtiment potentiellement raccordable à un réseau existant',
    "Le bâtiment est jugé potentiellement raccordable s'il se situe à moins de 200 m d'un réseau existant, sauf sur Paris où ce seuil est réduit à 100 m. Attention, le mode de chauffage n'est pas pris en compte.",
  ],
  ['Distance au réseau (m) si < 1000 m', 'Distance au réseau le plus proche, fournie uniquement si elle est de moins de 1000m'],
  [
    'PDP (périmètre de développement prioritaire)',
    "Positif si l'adresse se situe dans le périmètre de développement prioritaire d'un réseau classé (d'après les données dont nous disposons). Une obligation de raccordement peut alors s'appliquer. En savoir plus : https://france-chaleur-urbaine.beta.gouv.fr/ressources/prioritaire",
  ],
  [
    'Bâtiment potentiellement raccordable à un réseau en construction',
    'Le bâtiment est situé à moins de 200 m du tracé d’un réseau en construction, ou situé dans une zone sur laquelle nous avons connaissance d’un réseau en construction ou en cours de mise en service (voir la carte pour visualiser les zones)',
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
  [
    'Présence d’un réseau non localisé sur la commune',
    'Présence d’un réseau non localisé sur la commune : un réseau existe dans cette commune, mais nous ne disposons pas de son tracé.',
  ],
  [], // empty line
  [
    'Mise en relation avec le gestionnaire',
    "Pour être mis en relation avec le gestionnaire d'un réseau pour obtenir plus d'informations, vous pouvez utiliser le formulaire en ligne sur notre site ou nous contacter par mail si le besoin concerne plusieurs adresses : france-chaleur-urbaine@developpement-durable.gouv.fr ",
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
        address.inPDP ? 'Oui' : 'Non',
        address.isEligible && address.futurNetwork ? 'Oui' : 'Non',
        address.id,
        address.tauxENRR,
        address.co2 ? Math.round(address.co2 * 1000) : null,
        address.hasNoTraceNetwork ? 'Oui' : 'Non',
      ])
    )
  );
  XLSX.utils.book_append_sheet(wb, ws, 'Résultats');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(legend), 'Légende');
  return XLSX.write(wb, { bookType: EXPORT_FORMAT.XLSX, type: 'base64' });
};

export const getNetworkEligibilityDistances = (networkId: string) => {
  // cas spécifique pour les réseaux de Paris
  return ['7501C', '7511C'].includes(networkId)
    ? { eligibleDistance: 100, veryEligibleDistance: 60 }
    : { eligibleDistance: 200, veryEligibleDistance: 100 };
};

export const getCityEligilityStatus = async (city: string): Promise<CityNetwork> => {
  const [cityHasNetwork, cityHasFuturNetwork] = await Promise.all([hasNetworkInCity(city), hasFuturNetworkInCity(city)]);
  return { basedOnCity: true, cityHasNetwork, cityHasFuturNetwork };
};

export type NetworkEligibilityStatus = {
  distance: number;
  isEligible: boolean;
  isVeryEligible: boolean;
  eligibleDistance: number;
  veryEligibleDistance: number;
  inPDP: boolean;
};

/**
 * Permet d'obtenir l'éligibilité d'un point géographique sur un réseau précis.
 */
export const getNetworkEligilityStatus = async (networkId: string, lat: number, lon: number): Promise<NetworkEligibilityStatus> => {
  const [networkInfos, inPDP] = await Promise.all([getDistanceToNetwork(networkId, lat, lon), isInPDP(lat, lon)]);
  const eligibilityDistances = getNetworkEligibilityDistances(networkId);

  return {
    distance: networkInfos.distance,
    inPDP,
    isEligible: networkInfos.distance <= eligibilityDistances.eligibleDistance,
    isVeryEligible: networkInfos.distance <= eligibilityDistances.veryEligibleDistance,
    ...eligibilityDistances,
  };
};

export const getEligilityStatus = async (lat: number, lon: number, city?: string): Promise<HeatNetwork> => {
  const [inPDP, inFuturNetwork, futurNetwork, network] = await Promise.all([
    isInPDP(lat, lon),
    closestInFuturNetwork(lat, lon),
    closestFuturNetwork(lat, lon),
    closestNetwork(lat, lon),
  ]);
  const noTraceNetwork = city ? await getNoTraceNetworkInCity(city) : null;

  const eligibilityDistances = getNetworkEligibilityDistances(network['Identifiant reseau']);
  const futurEligibilityDistances = getNetworkEligibilityDistances(''); // gets the default distances
  const eligibility = {
    isEligible: Number(network.distance) <= eligibilityDistances.eligibleDistance,
    veryEligibleDistance: eligibilityDistances.veryEligibleDistance,
  };
  const futurEligibility = {
    isEligible: futurNetwork.distance <= futurEligibilityDistances.eligibleDistance,
    veryEligibleDistance: futurEligibilityDistances.veryEligibleDistance,
  };

  if (eligibility.isEligible && Number(network.distance) < eligibility.veryEligibleDistance) {
    return {
      ...eligibility,
      distance: Math.round(network.distance),
      inPDP,
      isBasedOnIris: false,
      futurNetwork: false,
      id: network['Identifiant reseau'],
      name: network['nom_reseau'],
      tauxENRR: network['Taux EnR&R'],
      co2: network['contenu CO2 ACV'],
      gestionnaire: network['Gestionnaire'],
      isClasse: network['reseaux classes'],
      hasPDP: network['has_PDP'],
      hasNoTraceNetwork: null,
    };
  }
  if (futurEligibility.isEligible && Number(futurNetwork.distance) < futurEligibility.veryEligibleDistance) {
    return {
      ...futurEligibility,
      distance: Math.round(futurNetwork.distance),
      inPDP,
      isBasedOnIris: false,
      futurNetwork: true,
      id: null,
      name: null,
      tauxENRR: null,
      co2: null,
      gestionnaire: futurNetwork.gestionnaire,
      isClasse: null,
      hasPDP: null,
      hasNoTraceNetwork: null,
    };
  }

  if (inFuturNetwork) {
    return {
      isEligible: true,
      distance: null,
      veryEligibleDistance: null,
      inPDP,
      isBasedOnIris: false,
      futurNetwork: true,
      id: null,
      name: null,
      tauxENRR: null,
      co2: null,
      gestionnaire: inFuturNetwork.gestionnaire,
      isClasse: null,
      hasPDP: null,
      hasNoTraceNetwork: null,
    };
  }

  if (Number(network.distance) < 1000) {
    return {
      ...eligibility,
      distance: Math.round(network.distance),
      inPDP,
      isBasedOnIris: false,
      futurNetwork: false,
      id: network['Identifiant reseau'],
      name: network['nom_reseau'],
      tauxENRR: network['Taux EnR&R'],
      co2: network['contenu CO2 ACV'],
      gestionnaire: network['Gestionnaire'],
      isClasse: network['reseaux classes'],
      hasPDP: network['has_PDP'],
      hasNoTraceNetwork: null,
    };
  }

  if (Number(futurNetwork.distance) < 1000) {
    return {
      ...futurEligibility,
      distance: Math.round(futurNetwork.distance),
      inPDP,
      isBasedOnIris: false,
      futurNetwork: true,
      id: null,
      name: null,
      tauxENRR: null,
      co2: null,
      gestionnaire: futurNetwork.gestionnaire,
      isClasse: null,
      hasPDP: null,
      hasNoTraceNetwork: null,
    };
  }
  if (noTraceNetwork) {
    return {
      isEligible: false,
      distance: null,
      veryEligibleDistance: null,
      inPDP,
      isBasedOnIris: false,
      futurNetwork: false,
      id: noTraceNetwork['Identifiant reseau'],
      name: noTraceNetwork.nom_reseau,
      tauxENRR: noTraceNetwork['Taux EnR&R'],
      co2: noTraceNetwork['contenu CO2 ACV'],
      gestionnaire: noTraceNetwork.Gestionnaire,
      isClasse: null,
      hasPDP: null,
      hasNoTraceNetwork: true,
    };
  }

  return {
    isEligible: false,
    distance: null,
    veryEligibleDistance: null,
    inPDP,
    isBasedOnIris: false,
    futurNetwork: false,
    id: null,
    name: null,
    tauxENRR: null,
    co2: null,
    gestionnaire: null,
    isClasse: null,
    hasPDP: null,
    hasNoTraceNetwork: false,
  };
};
