import XLSX from 'xlsx';

import { clientConfig } from '@/client-config';
import db from '@/server/db';
import { kdb, sql, type ZoneDeDeveloppementPrioritaire } from '@/server/db/kysely';
import { findMetropoleNameTagByCity } from '@/server/services/epci';
import { getNetworkEligibilityDistances } from '@/services/eligibility';
import { EXPORT_FORMAT } from '@/types/enum/ExportFormat';
import type { CityNetwork, HeatNetwork } from '@/types/HeatNetworksResponse';

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

export const getConsommationGazAdresse = async (lat: number, lon: number) => {
  const result = await kdb
    .selectFrom('donnees_de_consos')
    .select('conso_nb')
    .where(
      sql<boolean>`
        ST_INTERSECTS(
          ST_Transform(${sql.raw(`'SRID=4326;POINT(${lon} ${lat})'::geometry`)}, 2154),
          ST_BUFFER(geom, 3.5)
        )
      `
    )
    .executeTakeFirst();
  return result;
};

export const getNbLogement = async (lat: number, lon: number) => {
  const result = await kdb
    .selectFrom('bdnb_batiments')
    .select(['batiment_groupe_id', 'ffo_bat_nb_log as nb_logements'])
    .where(
      sql.raw<boolean>(`
      ST_DWithin(
        geom,
        ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154),
        3.5
      )
    `)
    )
    .executeTakeFirst();
  return result;
};

export const getNbLogementById = async (id: string) => {
  const result = await kdb
    .selectFrom('bdnb_batiments')
    .select(['batiment_groupe_id', 'ffo_bat_nb_log as nb_logements'])
    .where('batiment_groupe_id', '=', id)
    .executeTakeFirst();
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
    "Positif si l'adresse se situe dans le périmètre de développement prioritaire d'un réseau classé (d'après les données dont nous disposons). Une obligation de raccordement peut alors s'appliquer. En savoir plus : https://france-chaleur-urbaine.beta.gouv.fr/ressources/obligations-raccordement",
  ],
  [
    'Bâtiment potentiellement raccordable à un réseau en construction',
    'Le bâtiment est situé à moins de 200 m du tracé d’un réseau en construction, ou situé dans une zone sur laquelle nous avons connaissance d’un réseau en construction ou en cours de mise en service (voir la carte pour visualiser les zones)',
  ],
  ['Identifiant du réseau le plus proche', 'Identifiant réseau national'],
  [
    'Taux EnR&R du réseau le plus proche',
    'Taux d’énergies renouvelables et de récupération issu de l’arrêté DPE du 11 avril 2025 (https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051520810)',
  ],
  [
    'Contenu CO2 ACV (g/kWh)',
    'Contenu CO2 en analyse du cycle de vie issu de l’arrêté DPE du 11 avril 2025 (https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051520810)',
  ],
  ['Présence d’un réseau non localisé sur la commune', 'Un réseau existe dans cette commune, mais nous ne disposons pas de son tracé.'],
  [], // empty line
  [
    'Mise en relation avec le gestionnaire',
    `Pour être mis en relation avec le gestionnaire d'un réseau pour obtenir plus d'informations, vous pouvez utiliser le formulaire en ligne sur notre site ou nous contacter par mail si le besoin concerne plusieurs adresses : ${clientConfig.contactEmail} `,
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
        address.isEligible && !address.futurNetwork ? 'Oui' : address.hasNoTraceNetwork ? 'A confirmer' : 'Non',
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

export const getCityEligilityStatus = async (city: string): Promise<CityNetwork> => {
  const [cityHasNetwork, cityHasFuturNetwork] = await Promise.all([hasNetworkInCity(city), hasFuturNetworkInCity(city)]);
  return { basedOnCity: true, cityHasFuturNetwork, cityHasNetwork };
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

/**
 * Deprecated in favor of getDetailedEligibilityStatus
 * @deprecated
 */
export const getEligilityStatus = async (lat: number, lon: number, city?: string): Promise<HeatNetwork> => {
  const [inPDP, inFuturNetwork, futurNetwork, network, noTraceNetwork] = await Promise.all([
    isInPDP(lat, lon),
    closestInFuturNetwork(lat, lon),
    closestFuturNetwork(lat, lon),
    closestNetwork(lat, lon),
    city ? await getNoTraceNetworkInCity(city) : null,
  ]);

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

  // Réseau existant à moins de 100m (60m sur Paris)
  if (eligibility.isEligible && Number(network.distance) < eligibility.veryEligibleDistance) {
    return {
      ...eligibility,
      co2: network['contenu CO2 ACV'],
      distance: Math.round(network.distance),
      futurNetwork: false,
      gestionnaire: network.Gestionnaire,
      hasNoTraceNetwork: null,
      hasPDP: network.has_PDP,
      id: network['Identifiant reseau'],
      inPDP,
      isClasse: network['reseaux classes'],
      name: network.nom_reseau,
      tauxENRR: network['Taux EnR&R'],
    };
  }
  // Réseau futur à moins de 100m (60 sur Paris)
  if (futurEligibility.isEligible && Number(futurNetwork.distance) < futurEligibility.veryEligibleDistance) {
    return {
      ...futurEligibility,
      co2: null,
      distance: Math.round(futurNetwork.distance),
      futurNetwork: true,
      gestionnaire: futurNetwork.gestionnaire,
      hasNoTraceNetwork: null,
      hasPDP: null,
      id: null,
      inPDP,
      isClasse: null,
      name: null,
      tauxENRR: null,
    };
  }

  // Dans zone futur réseau
  if (inFuturNetwork) {
    return {
      co2: null,
      distance: null,
      futurNetwork: true,
      gestionnaire: inFuturNetwork.gestionnaire,
      hasNoTraceNetwork: null,
      hasPDP: null,
      id: null,
      inPDP,
      isClasse: null,
      isEligible: true,
      name: null,
      tauxENRR: null,
      veryEligibleDistance: null,
    };
  }

  // Réseau existant entre 100 et 200m (60 et 100 sur Paris)
  if (eligibility.isEligible) {
    return {
      ...eligibility,
      co2: network['contenu CO2 ACV'],
      distance: Math.round(network.distance),
      futurNetwork: false,
      gestionnaire: network.Gestionnaire,
      hasNoTraceNetwork: null,
      hasPDP: network.has_PDP,
      id: network['Identifiant reseau'],
      inPDP,
      isClasse: network['reseaux classes'],
      name: network.nom_reseau,
      tauxENRR: network['Taux EnR&R'],
    };
  }

  // Réseau futur entre 100 et 200m (60 et 100 sur Paris)
  if (futurEligibility.isEligible) {
    return {
      ...futurEligibility,
      co2: null,
      distance: Math.round(futurNetwork.distance),
      futurNetwork: true,
      gestionnaire: futurNetwork.gestionnaire,
      hasNoTraceNetwork: null,
      hasPDP: null,
      id: null,
      inPDP,
      isClasse: null,
      name: null,
      tauxENRR: null,
    };
  }

  // Réseau existant entre 200 et 1000m
  if (Number(network.distance) < 1000) {
    return {
      ...eligibility,
      co2: network['contenu CO2 ACV'],
      distance: Math.round(network.distance),
      futurNetwork: false,
      gestionnaire: network.Gestionnaire,
      hasNoTraceNetwork: null,
      hasPDP: network.has_PDP,
      id: network['Identifiant reseau'],
      inPDP,
      isClasse: network['reseaux classes'],
      name: network.nom_reseau,
      tauxENRR: network['Taux EnR&R'],
    };
  }

  // Réseau futur entre 200 et 1000m
  if (Number(futurNetwork.distance) < 1000) {
    return {
      ...futurEligibility,
      co2: null,
      distance: Math.round(futurNetwork.distance),
      futurNetwork: true,
      gestionnaire: futurNetwork.gestionnaire,
      hasNoTraceNetwork: null,
      hasPDP: null,
      id: null,
      inPDP,
      isClasse: null,
      name: null,
      tauxENRR: null,
    };
  }

  // Pas de tracé sur la ville, mais ville où l’on sait qu’existe un réseau (repère)
  if (noTraceNetwork) {
    return {
      co2: noTraceNetwork['contenu CO2 ACV'],
      distance: null,
      futurNetwork: false,
      gestionnaire: noTraceNetwork.Gestionnaire,
      hasNoTraceNetwork: true,
      hasPDP: null,
      id: noTraceNetwork['Identifiant reseau'],
      inPDP,
      isClasse: null,
      isEligible: false,
      name: noTraceNetwork.nom_reseau,
      tauxENRR: noTraceNetwork['Taux EnR&R'],
      veryEligibleDistance: null,
    };
  }

  // Pas de tracé à moins de 1000m, ni repère réseau sur ville
  return {
    co2: null,
    distance: null,
    futurNetwork: false,
    gestionnaire: null,
    hasNoTraceNetwork: false,
    hasPDP: null,
    id: null,
    inPDP,
    isClasse: null,
    isEligible: false,
    name: null,
    tauxENRR: null,
    veryEligibleDistance: null,
  };
};

/**
 * Permet d'obtenir l'éligibilité d'un point géographique, avec plus d'informations sur les réseaux les plus proches.
 * Également plus efficace niveau requêtage que getNetworkEligilityStatus.
 */
export const getDetailedEligibilityStatus = async (lat: number, lon: number) => {
  const [commune, reseauDeChaleur, reseauDeChaleurSansTrace, reseauEnConstruction, zoneEnConstruction, pdp] = await Promise.all([
    kdb
      .selectFrom('ign_communes')
      .select(['nom', 'insee_com', 'insee_dep', 'insee_reg'])
      .orderBy((eb) => sql`${eb.ref('geom')} <-> ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)`)
      .limit(1)
      .executeTakeFirstOrThrow(),

    kdb
      .selectFrom('reseaux_de_chaleur')
      .select([
        'id_fcu',
        'Identifiant reseau',
        'nom_reseau',
        'tags',
        'communes',
        'Taux EnR&R',
        'contenu CO2 ACV',
        sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
          'distance'
        ),
      ])
      .where('has_trace', '=', true)
      .orderBy((eb) => sql`${eb.ref('geom')} <-> ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)`)
      .limit(1)
      .executeTakeFirstOrThrow(),

    kdb
      .with('commune', (eb) =>
        eb
          .selectFrom('ign_communes')
          .select(['insee_com', 'nom'])
          .where(
            (eb) =>
              sql`ST_Contains(
                ${eb.ref('geom')},
                ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)
              )`
          )
          .limit(1)
      )
      .selectFrom('reseaux_de_chaleur')
      .innerJoin('commune', (join) =>
        join.on((eb) => eb('commune.insee_com', '=', sql<string>`ANY(${eb.ref('reseaux_de_chaleur.communes_insee')})`))
      )
      .select(['id_fcu', 'Identifiant reseau', 'nom_reseau', 'commune.nom', 'tags', 'communes'])
      .where('has_trace', '=', false)
      .limit(1)
      .executeTakeFirst(),

    kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select([
        'id_fcu',
        'nom_reseau',
        'tags',
        'communes',
        sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
          'distance'
        ),
      ])
      .where('is_zone', '=', false)
      .orderBy((eb) => sql`${eb.ref('geom')} <-> ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)`)
      .limit(1)
      .executeTakeFirstOrThrow(),

    kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select([
        'id_fcu',
        'nom_reseau',
        'tags',
        'communes',
        sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
          'distance'
        ),
      ])
      .where('is_zone', '=', true)
      .orderBy((eb) => sql`${eb.ref('geom')} <-> ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)`)
      .limit(1)
      .executeTakeFirstOrThrow(),

    kdb
      .selectFrom('zone_de_developpement_prioritaire')
      .select(['id_fcu', 'Identifiant reseau', 'communes', 'reseau_de_chaleur_ids', 'reseau_en_construction_ids'])
      .where(
        (eb) =>
          sql`ST_Contains(
            ${eb.ref('geom')},
            ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)
          )`
      )
      .limit(1)
      .executeTakeFirst(),
  ]);

  const [departement, region, epci, ept, metropoleNameTag] = await Promise.all([
    kdb
      .selectFrom('ign_departements')
      .select(['nom', 'insee_dep'])
      .where('insee_dep', '=', commune.insee_dep)
      .limit(1)
      .executeTakeFirstOrThrow(),

    kdb
      .selectFrom('ign_regions')
      .select(['nom', 'insee_reg'])
      .where('insee_reg', '=', commune.insee_reg)
      .limit(1)
      .executeTakeFirstOrThrow(),

    kdb
      .selectFrom('epci')
      .select(['code', 'nom', 'type'])
      .where('membres', '@>', sql<any>`jsonb_build_array(jsonb_build_object('code', ${sql.lit(commune.insee_com)}))`)
      .limit(1)
      .executeTakeFirst(),

    kdb
      .selectFrom('ept')
      .select(['code', 'nom'])
      .where('membres', '@>', sql<any>`jsonb_build_array(jsonb_build_object('code', ${sql.lit(commune.insee_com)}))`)
      .limit(1)
      .executeTakeFirst(),

    findMetropoleNameTagByCity(commune.insee_com!),
  ]);

  const determineEligibilityResult = async (): Promise<EligibilityResult> => {
    const tagsDistanceThreshold = 500; // m
    const eligibilityDistances = getNetworkEligibilityDistances(reseauDeChaleur?.['Identifiant reseau'] ?? '');
    const futurEligibilityDistances = getNetworkEligibilityDistances(''); // gets the default distances

    // Dans un PDP
    if (pdp) {
      const networkInfos = await findPDPAssociatedNetwork(pdp, lat, lon);
      return {
        communes: pdp.communes ?? [],
        distance: networkInfos?.distance ?? 0,
        id_fcu: pdp.id_fcu,
        id_sncu: pdp['Identifiant reseau'] ?? '',
        nom: networkInfos?.nom_reseau ?? '',
        tags: networkInfos?.tags ?? [],
        type: networkInfos?.type === 'existant' ? 'dans_pdp_reseau_existant' : 'dans_pdp_reseau_futur',
      };
    }

    // Réseau existant à moins de 100m (60m sur Paris)
    if (reseauDeChaleur.distance <= eligibilityDistances.veryEligibleDistance) {
      return {
        communes: reseauDeChaleur.communes ?? [],
        distance: reseauDeChaleur.distance,
        id_fcu: reseauDeChaleur.id_fcu ?? '',
        id_sncu: reseauDeChaleur['Identifiant reseau'] ?? '',
        nom: reseauDeChaleur.nom_reseau ?? '',
        tags: reseauDeChaleur.distance <= tagsDistanceThreshold ? (reseauDeChaleur.tags ?? []) : [],
        type: 'reseau_existant_tres_proche',
      };
    }

    // Réseau futur à moins de 100m (60 sur Paris)
    if (reseauEnConstruction.distance <= futurEligibilityDistances.veryEligibleDistance) {
      return {
        communes: reseauEnConstruction.communes ?? [],
        distance: reseauEnConstruction.distance,
        id_fcu: reseauEnConstruction.id_fcu,
        id_sncu: '',
        nom: reseauEnConstruction.nom_reseau ?? '',
        tags: reseauEnConstruction.distance <= tagsDistanceThreshold ? (reseauEnConstruction.tags ?? []) : [],
        type: 'reseau_futur_tres_proche',
      };
    }

    // Dans zone futur réseau
    if (zoneEnConstruction.distance === 0) {
      return {
        communes: zoneEnConstruction.communes ?? [],
        distance: 0,
        id_fcu: zoneEnConstruction.id_fcu,
        id_sncu: '',
        nom: zoneEnConstruction.nom_reseau ?? '',
        tags: zoneEnConstruction.distance <= tagsDistanceThreshold ? (zoneEnConstruction.tags ?? []) : [],
        type: 'dans_zone_reseau_futur',
      };
    }

    // Réseau existant entre 100 et 200m (60 et 100 sur Paris)
    if (reseauDeChaleur.distance <= eligibilityDistances.eligibleDistance) {
      return {
        communes: reseauDeChaleur.communes ?? [],
        distance: reseauDeChaleur.distance,
        id_fcu: reseauDeChaleur.id_fcu,
        id_sncu: reseauDeChaleur['Identifiant reseau'] ?? '',
        nom: reseauDeChaleur.nom_reseau ?? '',
        tags: reseauDeChaleur.distance <= tagsDistanceThreshold ? (reseauDeChaleur.tags ?? []) : [],
        type: 'reseau_existant_proche',
      };
    }

    // Réseau futur entre 100 et 200m (60 et 100 sur Paris)
    if (reseauEnConstruction.distance <= futurEligibilityDistances.eligibleDistance) {
      return {
        communes: reseauEnConstruction.communes ?? [],
        distance: reseauEnConstruction.distance,
        id_fcu: reseauEnConstruction.id_fcu,
        id_sncu: '',
        nom: reseauEnConstruction.nom_reseau ?? '',
        tags: reseauEnConstruction.distance <= tagsDistanceThreshold ? (reseauEnConstruction.tags ?? []) : [],
        type: 'reseau_futur_proche',
      };
    }

    // Réseau existant entre 200 et 1000m
    if (reseauDeChaleur.distance <= 1000) {
      return {
        communes: reseauDeChaleur.communes ?? [],
        distance: reseauDeChaleur.distance,
        id_fcu: reseauDeChaleur.id_fcu,
        id_sncu: reseauDeChaleur['Identifiant reseau'] ?? '',
        nom: reseauDeChaleur.nom_reseau ?? '',
        tags: reseauDeChaleur.distance <= tagsDistanceThreshold ? (reseauDeChaleur.tags ?? []) : [],
        type: 'reseau_existant_loin',
      };
    }

    // Réseau futur entre 200 et 1000m
    if (reseauEnConstruction.distance <= 1000) {
      return {
        communes: reseauEnConstruction.communes ?? [],
        distance: reseauEnConstruction.distance,
        id_fcu: reseauEnConstruction.id_fcu,
        id_sncu: '',
        nom: reseauEnConstruction.nom_reseau ?? '',
        tags: reseauEnConstruction.distance <= tagsDistanceThreshold ? (reseauEnConstruction.tags ?? []) : [],
        type: 'reseau_futur_loin',
      };
    }

    // Pas de tracé sur la ville, mais ville où l'on sait qu'existe un réseau (repère)
    if (reseauDeChaleurSansTrace) {
      return {
        communes: [reseauDeChaleurSansTrace.nom ?? ''],
        distance: 0,
        id_fcu: reseauDeChaleurSansTrace.id_fcu,
        id_sncu: reseauDeChaleurSansTrace['Identifiant reseau'] ?? '',
        nom: reseauDeChaleurSansTrace.nom_reseau ?? '',
        tags: reseauDeChaleurSansTrace.tags ?? [],
        type: 'dans_ville_reseau_existant_sans_trace',
      };
    }

    // Pas de tracé à moins de 1000m, ni repère réseau sur ville
    return {
      communes: [],
      distance: 0,
      id_fcu: 0,
      id_sncu: '',
      nom: '',
      tags: [],
      type: 'trop_eloigne',
    };
  };
  const eligibilityResult = await determineEligibilityResult();

  return {
    ...eligibilityResult,
    commune,
    departement,
    eligible: [
      'dans_pdp_reseau_existant',
      'dans_pdp_reseau_futur',
      'reseau_existant_tres_proche',
      'reseau_futur_tres_proche',
      'dans_zone_reseau_futur',
      'reseau_existant_proche',
      'reseau_futur_proche',
    ].includes(eligibilityResult.type),
    epci,
    ept,
    pdp,
    region,
    reseauDeChaleur,
    reseauDeChaleurSansTrace,
    reseauEnConstruction,
    tags: [
      commune.nom!, // ville
      ...(metropoleNameTag ? [metropoleNameTag] : []), // métropole
      ...eligibilityResult.tags, // tags réseau + résultats des règles
    ],
    zoneEnConstruction,
  };
};

export type EligibilityType =
  | 'dans_pdp_reseau_existant'
  | 'dans_pdp_reseau_futur'
  | 'reseau_existant_tres_proche'
  | 'reseau_futur_tres_proche'
  | 'dans_zone_reseau_futur'
  | 'reseau_existant_proche'
  | 'reseau_futur_proche'
  | 'reseau_existant_loin'
  | 'reseau_futur_loin'
  | 'dans_ville_reseau_existant_sans_trace'
  | 'trop_eloigne';

type EligibilityResult = {
  id_fcu: number;
  type: EligibilityType;
  distance: number;
  id_sncu: string;
  nom: string;
  tags: string[];
  communes: string[];
};

export type DetailedEligibilityStatus = Awaited<ReturnType<typeof getDetailedEligibilityStatus>>;

/**
 * Récupère le réseau de chaleur ou en construction le plus proche tout en restant associé au PDP
 * @param pdp - Le PDP
 * @returns Les informations du réseau de chaleur ou en construction associé au PDP
 */
const findPDPAssociatedNetwork = async (
  pdp: Pick<ZoneDeDeveloppementPrioritaire, 'Identifiant reseau' | 'reseau_de_chaleur_ids' | 'reseau_en_construction_ids'>,
  lat: number,
  lon: number
) => {
  const [reseauDeChaleur, reseauEnConstruction, zoneEnConstruction] = await Promise.all([
    pdp['Identifiant reseau'] || pdp.reseau_de_chaleur_ids.length > 0
      ? kdb
          .selectFrom('reseaux_de_chaleur')
          .select([
            'id_fcu',
            'Identifiant reseau',
            'nom_reseau',
            'tags',
            'communes',
            sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
              'distance'
            ),
          ])
          .where('has_trace', '=', true)
          .where((eb) =>
            eb.or(
              [
                pdp['Identifiant reseau'] ? eb('Identifiant reseau', '=', pdp['Identifiant reseau']) : null,
                pdp.reseau_de_chaleur_ids.length > 0 ? eb('id_fcu', 'in', pdp.reseau_de_chaleur_ids) : null,
              ].filter((v) => !!v)
            )
          )
          .orderBy((eb) => sql`${eb.ref('geom')} <-> ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)`)
          .limit(1)
          .executeTakeFirst()
      : null,

    ...(pdp.reseau_en_construction_ids.length > 0
      ? [
          kdb
            .selectFrom('zones_et_reseaux_en_construction')
            .select([
              'id_fcu',
              'nom_reseau',
              'tags',
              'communes',
              sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
                'distance'
              ),
            ])
            .where('is_zone', '=', false)
            .where('id_fcu', 'in', pdp.reseau_en_construction_ids)
            .orderBy((eb) => sql`${eb.ref('geom')} <-> ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)`)
            .limit(1)
            .executeTakeFirst(),

          kdb
            .selectFrom('zones_et_reseaux_en_construction')
            .select([
              'id_fcu',
              'nom_reseau',
              'tags',
              'communes',
              sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
                'distance'
              ),
            ])
            .where('is_zone', '=', true)
            .where('id_fcu', 'in', pdp.reseau_en_construction_ids)
            .orderBy((eb) => sql`${eb.ref('geom')} <-> ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)`)
            .limit(1)
            .executeTakeFirst(),
        ]
      : []),
  ]);

  return zoneEnConstruction?.distance === 0
    ? { ...zoneEnConstruction, type: 'futur' }
    : reseauDeChaleur && reseauEnConstruction
      ? reseauDeChaleur.distance <= reseauEnConstruction.distance
        ? { ...reseauDeChaleur, type: 'existant' }
        : { ...reseauEnConstruction, type: 'futur' }
      : reseauDeChaleur
        ? { ...reseauDeChaleur, type: 'existant' }
        : { ...reseauEnConstruction, type: 'futur' };
};
