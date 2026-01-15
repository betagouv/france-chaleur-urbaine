import XLSX from 'xlsx';

import { clientConfig } from '@/client-config';
import { kdb, sql, type ZoneDeDeveloppementPrioritaire } from '@/server/db/kysely';
import { getNetworkEligibilityDistances } from '@/services/eligibility';
import { EXPORT_FORMAT } from '@/types/enum/ExportFormat';
import type { CityNetwork, HeatNetwork } from '@/types/HeatNetworksResponse';

import isInPDP from './pdp';

const hasNetworkInCity = async (city: string): Promise<boolean> => {
  const result = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select(['id_fcu'])
    .where(sql<boolean>`${sql.ref('communes')} @> ARRAY[${city}]`)
    .executeTakeFirst();
  return !!result;
};
const hasFuturNetworkInCity = async (city: string): Promise<boolean> => {
  const result = await kdb
    .selectFrom('zones_et_reseaux_en_construction')
    .select(['id_fcu'])
    .where(sql<boolean>`${sql.ref('communes')} @> ARRAY[${city}]`)
    .executeTakeFirst();
  return !!result;
};

type NetworkInfos = {
  distance: number;
  'Identifiant reseau': string;
  'Taux EnR&R': number;
  'contenu CO2 ACV': number;
  Gestionnaire: string;
  nom_reseau: string;
  'reseaux classes': boolean;
  has_PDP: boolean;
};

const getDistanceToNetwork = async (networkId: string, lat: number, lon: number) => {
  const network = await kdb
    .selectFrom('reseaux_de_chaleur')
    .select([
      'Identifiant reseau',
      'Taux EnR&R',
      'contenu CO2 ACV',
      'Gestionnaire',
      'nom_reseau',
      sql<number>`round(geom <-> ST_Transform(ST_GeomFromText('POINT(${sql.lit(lon)} ${sql.lit(lat)})', 4326), 2154))`.as('distance'),
    ])
    .where('has_trace', '=', true)
    .where('Identifiant reseau', '=', networkId)
    .executeTakeFirst();

  if (!network) {
    throw new Error(`Le réseau ${networkId} n'existe pas ou n'a pas de tracé`);
  }

  return network as NetworkInfos;
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
 * Convertit le résultat détaillé de getDetailedEligibilityStatus vers le format legacy HeatNetwork
 * Utilise directement les champs du résultat d'éligibilité qui contient déjà toutes les informations nécessaires
 */
const mapDetailedEligibilityToHeatNetwork = (detailed: DetailedEligibilityStatus): HeatNetwork => {
  const { eligible, distance, type, id_sncu, nom, pdp, gestionnaire, co2, tauxENRR, isClasse, hasPDP } = detailed;

  // Détermine si c'est un réseau futur
  const isFuturNetwork =
    type === 'reseau_futur_tres_proche' ||
    type === 'reseau_futur_proche' ||
    type === 'reseau_futur_loin' ||
    type === 'dans_zone_reseau_futur' ||
    type === 'dans_pdp_reseau_futur';

  // Récupère les distances d'éligibilité
  const eligibilityDistances = getNetworkEligibilityDistances(id_sncu || '');

  // Construit l'objet HeatNetwork en utilisant directement les informations du résultat
  const heatNetwork: HeatNetwork = {
    co2: co2 ?? null,
    distance,
    futurNetwork: isFuturNetwork,
    gestionnaire: gestionnaire ?? null,
    hasNoTraceNetwork: type === 'dans_ville_reseau_existant_sans_trace' ? true : type === 'trop_eloigne' ? false : null,
    hasPDP: hasPDP ?? null,
    id: id_sncu || null,
    inPDP: type === 'dans_pdp_reseau_existant' || type === 'dans_pdp_reseau_futur',
    isClasse: isClasse ?? null,
    isEligible: eligible,
    name: nom || null,
    tauxENRR: tauxENRR ?? null,
    veryEligibleDistance:
      type === 'dans_zone_reseau_futur' || type === 'dans_ville_reseau_existant_sans_trace' || type === 'trop_eloigne'
        ? null
        : eligibilityDistances.veryEligibleDistance,
  };

  return heatNetwork;
};

/**
 * Permet d'obtenir l'éligibilité d'un point géographique, avec plus d'informations sur les réseaux les plus proches.
 * @param lat - Latitude du point
 * @param lon - Longitude du point
 */
export const getEligilityStatus = async (lat: number, lon: number): Promise<HeatNetwork> => {
  // Utilise la nouvelle fonction avec les règles de gestion à jour
  const detailedStatus = await getDetailedEligibilityStatus(lat, lon);

  // Convertit vers le format legacy en utilisant directement les champs du résultat d'éligibilité
  return mapDetailedEligibilityToHeatNetwork(detailedStatus);
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
        'Gestionnaire',
        'reseaux classes',
        'has_PDP',
        sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
          'distance'
        ),
      ])
      .where('has_trace', '=', true)
      .where('ouvert_aux_raccordements', '=', true)
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
      .select([
        'id_fcu',
        'Identifiant reseau',
        'nom_reseau',
        'commune.nom',
        'tags',
        'communes',
        'Gestionnaire',
        'Taux EnR&R',
        'contenu CO2 ACV',
      ])
      .where('has_trace', '=', false)
      .where('ouvert_aux_raccordements', '=', true)
      .limit(1)
      .executeTakeFirst(),

    kdb
      .selectFrom('zones_et_reseaux_en_construction')
      .select([
        'id_fcu',
        'nom_reseau',
        'tags',
        'communes',
        'gestionnaire',
        sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
          'distance'
        ),
      ])
      .where('is_zone', '=', false)
      .where('ouvert_aux_raccordements', '=', true)
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
        'gestionnaire',
        sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
          'distance'
        ),
      ])
      .where('is_zone', '=', true)
      .where('ouvert_aux_raccordements', '=', true)
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

  const [departement, region, epci, ept] = await Promise.all([
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
  ]);

  const determineEligibilityResult = async (): Promise<EligibilityResult> => {
    const tagsDistanceThreshold = 500; // m
    const eligibilityDistances = getNetworkEligibilityDistances(reseauDeChaleur?.['Identifiant reseau'] ?? '');
    const futurEligibilityDistances = getNetworkEligibilityDistances(''); // gets the default distances

    // Dans un PDP
    if (pdp) {
      const networkInfos = await findPDPAssociatedNetwork(pdp, lat, lon);
      return {
        co2: networkInfos.type === 'existant' ? (networkInfos?.['contenu CO2 ACV'] ?? null) : null,
        communes: pdp.communes ?? [],
        distance: networkInfos?.distance ?? 0,
        gestionnaire: networkInfos?.gestionnaire ?? null,
        hasPDP: true,
        id_fcu: pdp.id_fcu,
        id_sncu: pdp['Identifiant reseau'] ?? (networkInfos?.type === 'existant' ? networkInfos?.['Identifiant reseau'] : null) ?? '',
        isClasse: networkInfos?.type === 'existant' ? (networkInfos?.['reseaux classes'] ?? null) : null,
        nom: networkInfos?.nom_reseau ?? '',
        tags: networkInfos?.tags ?? [],
        tauxENRR: networkInfos.type === 'existant' ? (networkInfos?.['Taux EnR&R'] ?? null) : null,
        type: networkInfos?.type === 'existant' ? 'dans_pdp_reseau_existant' : 'dans_pdp_reseau_futur',
      };
    }

    // Réseau existant à moins de 100m (60m sur Paris)
    if (reseauDeChaleur && reseauDeChaleur.distance <= eligibilityDistances.veryEligibleDistance) {
      return {
        co2: reseauDeChaleur['contenu CO2 ACV'] ?? null,
        communes: reseauDeChaleur.communes ?? [],
        distance: reseauDeChaleur.distance,
        gestionnaire: reseauDeChaleur.Gestionnaire ?? null,
        hasPDP: reseauDeChaleur.has_PDP ?? null,
        id_fcu: reseauDeChaleur.id_fcu ?? '',
        id_sncu: reseauDeChaleur['Identifiant reseau'] ?? '',
        isClasse: reseauDeChaleur['reseaux classes'] ?? null,
        nom: reseauDeChaleur.nom_reseau ?? '',
        tags: reseauDeChaleur.distance <= tagsDistanceThreshold ? (reseauDeChaleur.tags ?? []) : [],
        tauxENRR: reseauDeChaleur['Taux EnR&R'] ?? null,
        type: 'reseau_existant_tres_proche',
      };
    }

    // Réseau futur à moins de 100m (60 sur Paris)
    if (reseauEnConstruction && reseauEnConstruction.distance <= futurEligibilityDistances.veryEligibleDistance) {
      return {
        co2: null,
        communes: reseauEnConstruction.communes ?? [],
        distance: reseauEnConstruction.distance,
        gestionnaire: reseauEnConstruction.gestionnaire ?? null,
        hasPDP: false,
        id_fcu: reseauEnConstruction.id_fcu,
        id_sncu: '',
        isClasse: null,
        nom: reseauEnConstruction.nom_reseau ?? '',
        tags: reseauEnConstruction.distance <= tagsDistanceThreshold ? (reseauEnConstruction.tags ?? []) : [],
        tauxENRR: null,
        type: 'reseau_futur_tres_proche',
      };
    }

    // Dans zone futur réseau
    if (zoneEnConstruction && zoneEnConstruction.distance === 0) {
      return {
        co2: null,
        communes: zoneEnConstruction.communes ?? [],
        distance: null,
        gestionnaire: zoneEnConstruction.gestionnaire ?? null,
        hasPDP: false,
        id_fcu: zoneEnConstruction.id_fcu,
        id_sncu: '',
        isClasse: null,
        nom: zoneEnConstruction.nom_reseau ?? '',
        tags: zoneEnConstruction.distance <= tagsDistanceThreshold ? (zoneEnConstruction.tags ?? []) : [],
        tauxENRR: null,
        type: 'dans_zone_reseau_futur',
      };
    }

    // Réseau existant entre 100 et 200m (60 et 100 sur Paris)
    if (reseauDeChaleur && reseauDeChaleur.distance <= eligibilityDistances.eligibleDistance) {
      return {
        co2: reseauDeChaleur['contenu CO2 ACV'] ?? null,
        communes: reseauDeChaleur.communes ?? [],
        distance: reseauDeChaleur.distance,
        gestionnaire: reseauDeChaleur.Gestionnaire ?? null,
        hasPDP: reseauDeChaleur.has_PDP ?? null,
        id_fcu: reseauDeChaleur.id_fcu,
        id_sncu: reseauDeChaleur['Identifiant reseau'] ?? '',
        isClasse: reseauDeChaleur['reseaux classes'] ?? null,
        nom: reseauDeChaleur.nom_reseau ?? '',
        tags: reseauDeChaleur.distance <= tagsDistanceThreshold ? (reseauDeChaleur.tags ?? []) : [],
        tauxENRR: reseauDeChaleur['Taux EnR&R'] ?? null,
        type: 'reseau_existant_proche',
      };
    }

    // Réseau futur entre 100 et 200m (60 et 100 sur Paris)
    if (reseauEnConstruction && reseauEnConstruction.distance <= futurEligibilityDistances.eligibleDistance) {
      return {
        co2: null,
        communes: reseauEnConstruction.communes ?? [],
        distance: reseauEnConstruction.distance,
        gestionnaire: reseauEnConstruction.gestionnaire ?? null,
        hasPDP: false,
        id_fcu: reseauEnConstruction.id_fcu,
        id_sncu: '',
        isClasse: null,
        nom: reseauEnConstruction.nom_reseau ?? '',
        tags: reseauEnConstruction.distance <= tagsDistanceThreshold ? (reseauEnConstruction.tags ?? []) : [],
        tauxENRR: null,
        type: 'reseau_futur_proche',
      };
    }

    // Réseau existant entre 200 et 1000m
    if (reseauDeChaleur && reseauDeChaleur.distance <= 1000) {
      return {
        co2: reseauDeChaleur['contenu CO2 ACV'] ?? null,
        communes: reseauDeChaleur.communes ?? [],
        distance: reseauDeChaleur.distance,
        gestionnaire: reseauDeChaleur.Gestionnaire ?? null,
        hasPDP: reseauDeChaleur.has_PDP ?? null,
        id_fcu: reseauDeChaleur.id_fcu,
        id_sncu: reseauDeChaleur['Identifiant reseau'] ?? '',
        isClasse: reseauDeChaleur['reseaux classes'] ?? null,
        nom: reseauDeChaleur.nom_reseau ?? '',
        tags: reseauDeChaleur.distance <= tagsDistanceThreshold ? (reseauDeChaleur.tags ?? []) : [],
        tauxENRR: reseauDeChaleur['Taux EnR&R'] ?? null,
        type: 'reseau_existant_loin',
      };
    }

    // Réseau futur entre 200 et 1000m
    if (reseauEnConstruction && reseauEnConstruction.distance <= 1000) {
      return {
        co2: null,
        communes: reseauEnConstruction.communes ?? [],
        distance: reseauEnConstruction.distance,
        gestionnaire: reseauEnConstruction.gestionnaire ?? null,
        hasPDP: false,
        id_fcu: reseauEnConstruction.id_fcu,
        id_sncu: '',
        isClasse: null,
        nom: reseauEnConstruction.nom_reseau ?? '',
        tags: reseauEnConstruction.distance <= tagsDistanceThreshold ? (reseauEnConstruction.tags ?? []) : [],
        tauxENRR: null,
        type: 'reseau_futur_loin',
      };
    }

    // Pas de tracé sur la ville, mais ville où l'on sait qu'existe un réseau (repère)
    if (reseauDeChaleurSansTrace) {
      return {
        co2: reseauDeChaleurSansTrace['contenu CO2 ACV'] ?? null,
        communes: [reseauDeChaleurSansTrace.nom ?? ''],
        distance: 0,
        gestionnaire: reseauDeChaleurSansTrace.Gestionnaire ?? null,
        hasPDP: false,
        id_fcu: reseauDeChaleurSansTrace.id_fcu,
        id_sncu: reseauDeChaleurSansTrace['Identifiant reseau'] ?? '',
        isClasse: null,
        nom: reseauDeChaleurSansTrace.nom_reseau ?? '',
        tags: reseauDeChaleurSansTrace.tags ?? [],
        tauxENRR: reseauDeChaleurSansTrace['Taux EnR&R'] ?? null,
        type: 'dans_ville_reseau_existant_sans_trace',
      };
    }

    // Pas de tracé à moins de 1000m, ni repère réseau sur ville
    return {
      co2: null,
      communes: [],
      distance: null,
      gestionnaire: null,
      hasPDP: null,
      id_fcu: null,
      id_sncu: '',
      isClasse: null,
      nom: '',
      tags: [],
      tauxENRR: null,
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
  id_fcu: number | null;
  type: EligibilityType;
  distance: number | null;
  id_sncu: string;
  nom: string;
  tags: string[];
  communes: string[];
  gestionnaire: string | null;
  co2: number | null;
  tauxENRR: number | null;
  isClasse: boolean | null;
  hasPDP: boolean | null;
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
            'Gestionnaire as gestionnaire',
            'Taux EnR&R',
            'contenu CO2 ACV',
            'reseaux classes',
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
              'gestionnaire',
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
              'gestionnaire',
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
    ? { ...zoneEnConstruction, type: 'futur' as const }
    : reseauDeChaleur && reseauEnConstruction
      ? reseauDeChaleur.distance <= reseauEnConstruction.distance
        ? { ...reseauDeChaleur, type: 'existant' as const }
        : { ...reseauEnConstruction, type: 'futur' as const }
      : reseauDeChaleur
        ? { ...reseauDeChaleur, type: 'existant' as const }
        : { ...reseauEnConstruction, type: 'futur' as const };
};
