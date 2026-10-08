import { TRPCError } from '@trpc/server';

import { businessRules } from '@/modules/app/business-rules';
import { EMPTY_BAT_ENR_INFO, getBatEnrInfoFromBatiment } from '@/modules/chaleur-renouvelable/bat-enr';
import type {
  AddressEligibilityContextInput,
  AdminUpdateDemandeChaleurRenouvelableInput,
  AdminValidateDemandeChaleurRenouvelableInput,
  BatEnrBatiment,
  BatEnrBatimentsSelectionContext,
  BatEnrByBanIdInput,
  CcrtUpdateDemandeChaleurRenouvelableInput,
  ColdNetworkEligibility,
  DemandeChaleurRenouvelable,
  DemandeChaleurRenouvelableProjectState,
  DemandeChaleurRenouvelableStatus,
  FranceRenovSpace,
  FranceRenovSpaceInput,
  GetLocationInput,
} from '@/modules/chaleur-renouvelable/constants';
import {
  DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
  IS_CCRT_DEMAND_ENABLED,
  isCcrtExperimentationEligible,
} from '@/modules/chaleur-renouvelable/constants';
import type { Context } from '@/modules/config/server/context-builder';
import { type CreateDemandInput, type DemandSubmissionResult, fcrLegacyValueKeys } from '@/modules/demands/constants';
import { createDemand } from '@/modules/demands/server/creation-user';
import { type LegacyValuesPatch, mergeLegacyValues } from '@/modules/demands/server/legacy-values';
import { sendEmailTemplate } from '@/modules/email';
import type { GetBdnbConstructionInput } from '@/modules/tiles/constants';
import { serverConfig } from '@/server/config';
import { kdb, sql } from '@/server/db/kysely';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { processInParallel } from '@/utils/async';
import { dayjs } from '@/utils/date';
import { fetchJSON } from '@/utils/network';
import { stripDomainFromURL } from '@/utils/url';

import { getAltitudeByCoordinates } from './altimetry';
import { recordCcrtPostHogEvent } from './ccrt-tracking';
import { getFranceRenovSpaceByCityCode } from './france-renov-spaces';
import { getNetworkEligibilityCoordinates, type NetworkEligibilityCoordinates } from './network-eligibility-coordinates';
import { getRnicCoproprieteByBatimentConstructionId } from './rnic';

const batEnrBatimentColumns = [
  'ac1',
  'ac2',
  'ac3',
  'ac4',
  'ac4bis',
  'adresse',
  'batiment_construction_id',
  'batiment_groupe_id',
  'categorie_majoritaire',
  'classe_bilan_dpe',
  'couv_sondes_200_2025',
  'couv_st_ecs_2025',
  'etat_ppa',
  'gis_geo_profonde',
  'gmi_nappe_200',
  'gmi_sonde_200',
  'place_nappe',
  'pot_nappe',
  'prod_st_mwh_an',
  'propri_uni',
  'type_energie_chauffage',
  'type_energie_ecs',
  'type_installation_chauffage',
  'type_installation_ecs',
] as const;

const BAT_ENR_PRESELECTED_BUILDING_RADIUS_METERS = businessRules.fcrBuildingCandidatesRadiusMeters.value;
const CHALEUR_RENOUVELABLE_RESULTS_PATH = '/chaleur-renouvelable/resultat';
const CCRT_DEMANDES_PATH = '/pro/demandes-chaleur-renouvelable';

type BanAddressSearchResponse = {
  features: {
    properties: {
      citycode: string;
    };
  }[];
};

const singleConstructionHousingCount = sql<number | null>`
  (
    SELECT
      CASE
        WHEN jsonb_array_length(COALESCE(bdnb_batiments.constructions, '[]'::jsonb)) = 1
          THEN bdnb_batiments.ffo_bat_nb_log
        ELSE NULL
      END
    FROM bdnb_batiments
    WHERE bdnb_batiments.batiment_groupe_id = bdnb_batenr.batiment_groupe_id
    LIMIT 1
  )
`.as('ffo_bat_nb_log');

const singleConstructionBuildingArea = sql<number | null>`
  (
    SELECT
      CASE
        WHEN jsonb_array_length(COALESCE(bdnb_batiments.constructions, '[]'::jsonb)) = 1
          THEN bdnb_batiments.dpe_representatif_logement_surface_habitable_immeuble
        ELSE NULL
      END
    FROM bdnb_batiments
    WHERE bdnb_batiments.batiment_groupe_id = bdnb_batenr.batiment_groupe_id
    LIMIT 1
  )
`.as('dpe_representatif_logement_surface_habitable_immeuble');

const getDemandAddressTerritory = (context: string) => {
  const [department = '', , region = ''] = context.split(',').map((contextPart) => contextPart.trim());

  return { department, region };
};

const getDemandeChaleurRenouvelableDepartmentCode = async (input: DemandeChaleurRenouvelable) => {
  if (!input.geoAddress) {
    return null;
  }

  const locationInfos = await getLocationInfos({ city: input.geoAddress.city, cityCode: input.geoAddress.cityCode });

  return locationInfos?.departement_id;
};

const getDemandHeatingEnergy = (heatingEnergy: DemandeChaleurRenouvelable['heatingEnergy']): CreateDemandInput['heatingEnergy'] => {
  switch (heatingEnergy) {
    case 'Électricité':
      return 'électricité';
    case 'Gaz':
      return 'gaz';
    case 'Fioul':
      return 'fioul';
    default:
      return 'autre';
  }
};

const getDemandHeatingType = (housingType: DemandeChaleurRenouvelable['housingType']): CreateDemandInput['heatingType'] =>
  housingType === 'immeuble_chauffage_collectif' ? 'collectif' : 'individuel';

const getDemandStructure = (
  input: DemandeChaleurRenouvelable
): Pick<CreateDemandInput, 'companyType' | 'demandCompanyType' | 'structure'> => {
  if (input.demandConcern === 'Une maison individuelle' || input.occupantStatus === 'Propriétaire de maison individuelle') {
    return { companyType: '', demandCompanyType: '', structure: 'Maison individuelle' };
  }

  if (input.occupantStatus === 'Bailleur social') {
    return { companyType: '', demandCompanyType: '', structure: 'Bailleur social' };
  }

  if (input.occupantStatus === 'Copropriétaire' || input.occupantStatus === 'Syndicat de copropriété') {
    return { companyType: 'Syndic de copropriété', demandCompanyType: '', structure: 'Copropriété' };
  }

  if (input.occupantStatus === "Bureau d'étude ou AMO") {
    return {
      companyType: "Bureau d'études ou AMO",
      demandCompanyType: getDemandCompanyType(input.demandConcern),
      structure: 'Tertiaire',
    };
  }

  if (input.occupantStatus === 'Mandataire ou Délégataire CEE') {
    return {
      companyType: 'Mandataire / délégataire CEE',
      demandCompanyType: getDemandCompanyType(input.demandConcern),
      structure: 'Tertiaire',
    };
  }

  return { companyType: input.occupantStatus, demandCompanyType: '', structure: 'Tertiaire' };
};

const getDemandCompanyType = (demandConcern: DemandeChaleurRenouvelable['demandConcern']) => {
  switch (demandConcern) {
    case 'Une copropriété':
      return 'Copropriété';
    case 'Une maison individuelle':
      return 'Maison individuelle';
    case 'Un bâtiment tertiaire':
      return 'Bâtiment tertiaire';
    case 'Plusieurs bâtiments':
      return 'Autre';
    default:
      return '';
  }
};

const getFcrSimulationPath = (simulationUrl: string) => {
  const simulationPath = stripDomainFromURL(simulationUrl);
  const simulationPathname = simulationPath?.split(/[?#]/)[0];

  return simulationPathname === CHALEUR_RENOUVELABLE_RESULTS_PATH ? simulationPath : null;
};

const getFcrDemandLegacyValues = (input: DemandeChaleurRenouvelable) => {
  const alternativeHeatingSolutions = input.alternativeHeatingSolutions ?? [];
  const simulationPath = getFcrSimulationPath(input.simulationUrl);

  return {
    ...(alternativeHeatingSolutions.length > 0 && {
      [fcrLegacyValueKeys.alternativeHeatingSolutions]: alternativeHeatingSolutions,
    }),
    ...(simulationPath && { [fcrLegacyValueKeys.simulationUrl]: simulationPath }),
  } satisfies LegacyValuesPatch;
};

const getCcrtDemandesUrl = (demandId?: string) =>
  demandId ? `${CCRT_DEMANDES_PATH}?demandes_chaleur_renouvelable_ccrt_search=${encodeURIComponent(demandId)}` : CCRT_DEMANDES_PATH;

const getCcrtTrackingDemandProperties = ({
  demandId,
  departmentCode,
  solution1,
  structureName,
}: {
  demandId: string;
  departmentCode: string | null;
  solution1?: string | null;
  structureName?: string | null;
}) => ({
  demande_id: demandId,
  departement: departmentCode,
  solution_1: solution1 ?? null,
  structure_ccrt: structureName ?? null,
});

const getProjectStateForStatus = ({
  projectState,
  status,
}: {
  projectState?: DemandeChaleurRenouvelableProjectState;
  status: DemandeChaleurRenouvelableStatus;
}) =>
  status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION && projectState
    ? projectState
    : DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION;

const assertProjectStateCanBeUpdated = ({
  projectState,
  status,
}: {
  projectState?: DemandeChaleurRenouvelableProjectState;
  status: DemandeChaleurRenouvelableStatus;
}) => {
  if (projectState !== undefined && status !== DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: "L'état du projet ne peut être modifié qu'après validation de l'étude de faisabilité en AG.",
    });
  }
};

const patchDemandWithFcrSnapshot = async (demandId: string, legacyValues: LegacyValuesPatch) => {
  if (Object.keys(legacyValues).length === 0) {
    return;
  }

  await kdb
    .updateTable('demands')
    .set({ legacy_values: mergeLegacyValues(legacyValues) })
    .where('id', '=', demandId)
    .execute();
};

const createRaccordableDemand = async (input: DemandeChaleurRenouvelable): Promise<DemandSubmissionResult | null> => {
  if (input.isPublicAdvisorSelected || input.originDemandId || !input.geoAddress || input.heatNetworkEligibility?.isEligible !== true) {
    return null;
  }

  const [lon, lat] = input.geoAddress.coordinates;
  const { department, region } = getDemandAddressTerritory(input.geoAddress.context);
  const demandStructure = getDemandStructure(input);
  const organizationName = input.organizationName ?? '';

  const demandSubmissionResult = await createDemand(
    {
      address: input.address,
      city: input.geoAddress.city,
      commentUser: input.comments ?? '',
      company: organizationName,
      companyType: demandStructure.companyType,
      coords: { lat, lon },
      demandArea: input.surfaceArea ?? input.averageArea * input.housingCount,
      demandCompanyName: organizationName,
      demandCompanyType: demandStructure.demandCompanyType,
      department,
      eligibility: input.heatNetworkEligibility,
      email: input.email,
      firstName: input.firstName,
      heatingEnergy: getDemandHeatingEnergy(input.heatingEnergy),
      heatingType: getDemandHeatingType(input.housingType),
      lastName: input.lastName,
      nbLogements: input.housingCount,
      phone: input.phone,
      postcode: input.geoAddress.postcode,
      region,
      structure: demandStructure.structure,
      termOfUse: true,
    },
    { deduplicate: true }
  );

  await patchDemandWithFcrSnapshot(demandSubmissionResult.id, getFcrDemandLegacyValues(input));

  return demandSubmissionResult;
};

const selectBatEnrBatimentDetails = () =>
  kdb
    .selectFrom('bdnb_batenr')
    .select(batEnrBatimentColumns)
    .select(singleConstructionHousingCount)
    .select(singleConstructionBuildingArea)
    .select(sql<GeoJSON.Geometry | null>`ST_AsGeoJSON(ST_Transform(geom, 4326))::json`.as('geometry'));

export const getBatEnrBatimentDetails = async (input: GetBdnbConstructionInput): Promise<BatEnrBatiment | undefined> => {
  if ('batiment_construction_id' in input) {
    const batiment = await selectBatEnrBatimentDetails()
      .where('batiment_construction_id', '=', input.batiment_construction_id)
      .executeTakeFirst();

    return batiment;
  }

  const { lat, lon } = input;

  const batiment = await selectBatEnrBatimentDetails()
    .where('geom', 'is not', null)
    .orderBy(sql`geom <-> ST_Transform(ST_GeomFromText('POINT(${sql.lit(lon)} ${sql.lit(lat)})', 4326), 2154)`)
    .limit(1)
    .executeTakeFirst();

  return batiment;
};

export const getBatEnrBatimentsByConstructionIds = async (batimentConstructionIds: string[]): Promise<BatEnrBatiment[]> => {
  const uniqueBatimentConstructionIds = [...new Set(batimentConstructionIds)];

  if (uniqueBatimentConstructionIds.length === 0) {
    return [];
  }

  return await selectBatEnrBatimentDetails().where('batiment_construction_id', 'in', uniqueBatimentConstructionIds).execute();
};

export const getBatEnrBatimentsSelectionContextByBanId = async ({
  banId,
}: BatEnrByBanIdInput): Promise<BatEnrBatimentsSelectionContext> => {
  const preselectedBatimentConstructionId = await getPreselectedBatimentConstructionIdFromRnb(banId).catch(() => null);
  let addressBatimentConstructionIds: string[] | null = null;
  const getAddressBatimentConstructionIds = async () => {
    addressBatimentConstructionIds ??= await getBatEnrBatimentConstructionIdsByBanId({ banId });

    return addressBatimentConstructionIds;
  };
  const referenceBatimentConstructionId = preselectedBatimentConstructionId ?? (await getAddressBatimentConstructionIds())[0] ?? null;

  if (!referenceBatimentConstructionId) {
    return {
      batiments: [],
      preselectedBatimentConstructionId: null,
    };
  }

  const batiments = await getBatEnrBatimentsWithinDistanceFromConstructionId(
    referenceBatimentConstructionId,
    BAT_ENR_PRESELECTED_BUILDING_RADIUS_METERS
  );

  if (batiments.length === 0) {
    return {
      batiments: await getBatEnrBatimentsByConstructionIds(await getAddressBatimentConstructionIds()),
      preselectedBatimentConstructionId: referenceBatimentConstructionId,
    };
  }

  return {
    batiments,
    preselectedBatimentConstructionId: referenceBatimentConstructionId,
  };
};

const getBatEnrBatimentsWithinDistanceFromConstructionId = async (batimentConstructionId: string, distanceMeters: number) => {
  const referenceGeometry = sql`
    (
      SELECT reference.geom
      FROM bdnb_batenr AS reference
      WHERE reference.batiment_construction_id = ${batimentConstructionId}
        AND reference.geom IS NOT NULL
      LIMIT 1
    )
  `;

  return await selectBatEnrBatimentDetails()
    .where('geom', 'is not', null)
    .where(sql<boolean>`ST_DWithin(geom, ${referenceGeometry}, ${distanceMeters})`)
    .orderBy(sql`geom <-> ${referenceGeometry}`)
    .execute();
};

export const getLocationInfos = async ({ cityCode, city }: GetLocationInput) => {
  const communeInfo = await kdb
    .selectFrom('communes')
    .select(['altitude_moyenne', 'departement_id', 'temperature_ref_altitude_moyenne'])
    .where(
      'id',
      '=',
      sql<string>`COALESCE(
            (SELECT id FROM communes WHERE id = ${cityCode}),
            (SELECT id FROM communes WHERE commune = ${city.toUpperCase()}),
            (SELECT id FROM communes WHERE commune LIKE ${`${city.toUpperCase()}-%-ARRONDISSEMENT`})
          )`
    )
    .executeTakeFirst();

  return communeInfo;
};

export const getBatEnrBatimentsByBanId = async ({ banId }: BatEnrByBanIdInput) => {
  return await getBatEnrBatimentsByConstructionIds(await getBatEnrBatimentConstructionIdsByBanId({ banId }));
};

const getColdNetworkEligibility = async (lat: number, lon: number): Promise<ColdNetworkEligibility | null> => {
  const reseauDeFroid = await kdb
    .selectFrom('reseaux_de_froid')
    .select([
      'Identifiant reseau',
      'nom_reseau',
      sql<number>`round(ST_Distance(geom, ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)))`.as(
        'distance'
      ),
    ])
    .where('has_trace', '=', true)
    .where('geom', 'is not', null)
    .orderBy((eb) => sql`${eb.ref('geom')} <-> ST_Transform('SRID=4326;POINT(${sql.lit(lon)} ${sql.lit(lat)})'::geometry, 2154)`)
    .limit(1)
    .executeTakeFirst();

  return reseauDeFroid
    ? {
        distance: reseauDeFroid.distance,
        id: reseauDeFroid['Identifiant reseau'] ?? null,
        name: reseauDeFroid.nom_reseau ?? null,
      }
    : null;
};

const getBatEnrBatimentConstructionIdsByBanId = async ({ banId }: BatEnrByBanIdInput) => {
  const url = `${serverConfig.BDNB_API_BASE_URL}/rel_batiment_construction_adresse?select=batiment_construction_id&cle_interop_adr=eq.${encodeURIComponent(
    banId
  )}`;

  type BdnbConstructionAddressRelation = {
    batiment_construction_id: string | null;
  };
  const data = await fetchJSON<BdnbConstructionAddressRelation[]>(url);
  const batimentConstructionIds = data
    .map((relation) => relation.batiment_construction_id)
    .filter((batimentConstructionId): batimentConstructionId is string => batimentConstructionId !== null);

  return batimentConstructionIds;
};

const getBatEnrLookupResult = async ({
  banId,
  lat,
  lon,
  selectedBatimentConstructionId,
}: Pick<AddressEligibilityContextInput, 'banId' | 'lat' | 'lon' | 'selectedBatimentConstructionId'>) => {
  const selectionContext = await getBatEnrBatimentsSelectionContextByBanId({ banId }).catch(
    (): BatEnrBatimentsSelectionContext => ({ batiments: [], preselectedBatimentConstructionId: null })
  );
  const batEnrBatiments = selectionContext.batiments;

  if (selectedBatimentConstructionId) {
    const selectedBatEnrBatiment = batEnrBatiments.find((batiment) => batiment.batiment_construction_id === selectedBatimentConstructionId);

    if (selectedBatEnrBatiment) {
      return {
        batEnr: getBatEnrInfoFromBatiment(selectedBatEnrBatiment),
        batEnrBatiments,
        selectedBatEnrBatiment,
        shouldSelectBatEnrBatiment: false,
      };
    }
  }

  const preselectedBatEnrBatiment = selectionContext.preselectedBatimentConstructionId
    ? batEnrBatiments.find((batiment) => batiment.batiment_construction_id === selectionContext.preselectedBatimentConstructionId)
    : undefined;

  if (preselectedBatEnrBatiment) {
    return {
      batEnr: getBatEnrInfoFromBatiment(preselectedBatEnrBatiment),
      batEnrBatiments,
      selectedBatEnrBatiment: preselectedBatEnrBatiment,
      shouldSelectBatEnrBatiment: batEnrBatiments.length > 1,
    };
  }

  if (batEnrBatiments.length === 1) {
    return {
      batEnr: getBatEnrInfoFromBatiment(batEnrBatiments[0]),
      batEnrBatiments,
      selectedBatEnrBatiment: batEnrBatiments[0],
      shouldSelectBatEnrBatiment: false,
    };
  }

  if (batEnrBatiments.length > 1) {
    return {
      batEnr: EMPTY_BAT_ENR_INFO,
      batEnrBatiments,
      selectedBatEnrBatiment: undefined,
      shouldSelectBatEnrBatiment: true,
    };
  }

  const batEnrDetails = await getBatEnrBatimentDetails({ lat, lon }).catch(() => null);

  return {
    batEnr: getBatEnrInfoFromBatiment(batEnrDetails),
    batEnrBatiments: batEnrDetails ? [batEnrDetails] : [],
    selectedBatEnrBatiment: batEnrDetails ?? undefined,
    shouldSelectBatEnrBatiment: false,
  };
};

const getBatEnrAltitudeCoordinates = async (
  batimentConstructionId: string | null | undefined
): Promise<NetworkEligibilityCoordinates | null> => {
  if (!batimentConstructionId) {
    return null;
  }

  const coordinates = await kdb
    .selectFrom('bdnb_batenr')
    .select((eb) => [
      sql<number>`ST_X(ST_Transform(ST_PointOnSurface(${eb.ref('geom')}), 4326))`.as('lon'),
      sql<number>`ST_Y(ST_Transform(ST_PointOnSurface(${eb.ref('geom')}), 4326))`.as('lat'),
    ])
    .where('batiment_construction_id', '=', batimentConstructionId)
    .where('geom', 'is not', null)
    .where((eb) => sql<boolean>`NOT ST_IsEmpty(${eb.ref('geom')})`)
    .executeTakeFirst();

  return coordinates && Number.isFinite(coordinates.lat) && Number.isFinite(coordinates.lon) ? coordinates : null;
};

export const getAddressEligibilityContext = async (input: AddressEligibilityContextInput) => {
  const [batEnrLookup, infos] = await Promise.all([
    getBatEnrLookupResult(input),
    getLocationInfos({ city: input.city, cityCode: input.cityCode }),
  ]);
  const networkEligibilityCoordinates = getNetworkEligibilityCoordinates(
    { lat: input.lat, lon: input.lon },
    batEnrLookup.selectedBatEnrBatiment
  );
  const [eligibiliteReseauChaleur, eligibiliteReseauFroid, batEnrAltitudeCoordinates] = await Promise.all([
    getEligilityStatus(networkEligibilityCoordinates.lat, networkEligibilityCoordinates.lon),
    getColdNetworkEligibility(networkEligibilityCoordinates.lat, networkEligibilityCoordinates.lon),
    getBatEnrAltitudeCoordinates(batEnrLookup.selectedBatEnrBatiment?.batiment_construction_id),
  ]);
  const altitudeCoordinates = batEnrAltitudeCoordinates ?? networkEligibilityCoordinates;
  const altitude = (await getAltitudeByCoordinates(altitudeCoordinates)) ?? infos?.altitude_moyenne ?? null;

  return {
    altitude,
    batEnr: batEnrLookup.batEnr,
    batEnrBatiments: batEnrLookup.batEnrBatiments,
    codeDepartement: infos?.departement_id ?? '',
    eligibiliteReseauChaleur,
    eligibiliteReseauFroid,
    selectedBatEnrBatiment: batEnrLookup.selectedBatEnrBatiment,
    shouldSelectBatEnrBatiment: batEnrLookup.shouldSelectBatEnrBatiment,
    temperatureRef: infos?.temperature_ref_altitude_moyenne != null ? Number(infos.temperature_ref_altitude_moyenne) : null,
  };
};

export const getFranceRenovSpace = async (input: FranceRenovSpaceInput): Promise<FranceRenovSpace | null> => {
  const cityCode = await getFranceRenovCityCode(input);

  if (!cityCode) {
    return null;
  }

  return getFranceRenovSpaceByCityCode(cityCode);
};

const getFranceRenovCityCode = async ({ address, batimentConstructionId }: FranceRenovSpaceInput) => {
  const cityCodeFromConstruction = batimentConstructionId ? await getCityCodeFromBatimentConstructionId(batimentConstructionId) : null;

  if (cityCodeFromConstruction) {
    return cityCodeFromConstruction;
  }

  return address ? await getCityCodeFromAddress(address) : null;
};

const getCityCodeFromBatimentConstructionId = async (batimentConstructionId: string) => {
  const result = await kdb
    .selectFrom('bdnb_batenr')
    .leftJoin('bdnb_batiments', 'bdnb_batiments.batiment_groupe_id', 'bdnb_batenr.batiment_groupe_id')
    .select(
      sql<string | null>`
        COALESCE(
          bdnb_batiments.code_commune_insee,
          (
            SELECT ign_communes.insee_com
            FROM ign_communes
            WHERE bdnb_batenr.geom IS NOT NULL
              AND ST_Intersects(ign_communes.geom, bdnb_batenr.geom)
            LIMIT 1
          )
        )
      `.as('cityCode')
    )
    .where('bdnb_batenr.batiment_construction_id', '=', batimentConstructionId)
    .executeTakeFirst();

  return result?.cityCode ?? null;
};

const getCityCodeFromAddress = async (address: string) => {
  const result = await fetchJSON<BanAddressSearchResponse>(`${serverConfig.banApiBaseUrl}search`, {
    params: {
      limit: 1,
      q: address,
    },
  });

  return result.features[0]?.properties.citycode ?? null;
};

type RnbAddressBuildingsResponse = {
  results: {
    ext_ids: {
      id: string;
      source: string;
    }[];
  }[];
};

const getPreselectedBatimentConstructionIdFromRnb = async (banId: string) => {
  const data = await fetchJSON<RnbAddressBuildingsResponse>(`${serverConfig.RNB_API_BASE_URL}/buildings/address/`, {
    params: {
      cle_interop_ban: banId,
    },
  });

  const bdnbExternalId = data.results.flatMap((building) => building.ext_ids).find((externalId) => externalId.source === 'bdnb');

  return bdnbExternalId?.id ?? null;
};

export const createDemandeChaleurRenouvelable = async ({ input }: { input: DemandeChaleurRenouvelable }) => {
  const demandSubmissionResult = await createRaccordableDemand(input);

  if (demandSubmissionResult) {
    return {
      demandSubmissionResult,
      id: null,
    };
  }

  const ccrtDemandId = IS_CCRT_DEMAND_ENABLED ? await createCcrtExperimentationDemand(input) : null;

  return {
    demandSubmissionResult: null,
    id: ccrtDemandId,
  };
};

const getRnicCoproprieteSafe = async (batimentConstructionId: string | null) => {
  try {
    return await getRnicCoproprieteByBatimentConstructionId(batimentConstructionId);
  } catch {
    return null;
  }
};

const createCcrtExperimentationDemand = async (input: DemandeChaleurRenouvelable) => {
  const departmentCode = await getDemandeChaleurRenouvelableDepartmentCode(input);

  if (!departmentCode || !isCcrtExperimentationEligible(departmentCode, input.housingType)) {
    return null;
  }

  const [originDemandId, rnicCopropriete] = await Promise.all([
    getValidOriginDemandId(input),
    getRnicCoproprieteSafe(input.batimentConstructionId),
  ]);

  const createdCcrtDemand = await kdb
    .insertInto('demands_chaleur_renouvelable')
    .values({
      address: input.address,
      alternative_heating_solutions: input.alternativeHeatingSolutions ?? [],
      annual_heating_consumption: input.annualHeatingConsumption,
      average_area: input.averageArea,
      average_residents: input.averageResidents,
      batiment_construction_id: input.batimentConstructionId,
      comments: input.comments,
      created_at: new Date(),
      demand_concern: input.demandConcern,
      departement_code: departmentCode,
      dpe: input.dpe,
      email: input.email,
      first_name: input.firstName,
      heating_energy: input.heatingEnergy,
      hot_water_system_type: input.hotWaterSystemType,
      housing_count: input.housingCount,
      housing_type: input.housingType,
      is_public_advisor_selected: input.isPublicAdvisorSelected,
      last_name: input.lastName,
      occupant_status: input.occupantStatus,
      organization_name: input.organizationName,
      origin_demand_id: originDemandId,
      outdoor_space: input.outdoorSpace,
      phone: input.phone,
      project_status: input.projectStatus,
      radiator_type: input.radiatorType,
      refusal_period: input.refusalPeriod,
      refusal_reason: input.refusalReason,
      rnic_nom_copropriete: rnicCopropriete?.nomCopropriete ?? null,
      rnic_numero_immatriculation: rnicCopropriete?.numeroImmatriculation ?? null,
      rnic_siret_representant_legal: rnicCopropriete?.siretRepresentantLegal ?? null,
      simulation_url: input.simulationUrl,
      surface_area: input.surfaceArea,
      updated_at: new Date(),
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  await sendEmailTemplate('demands.demandeur.confirmation-demande-chaleur-renouvelable', { email: input.email }, { demand: input });

  return createdCcrtDemand.id;
};

const getValidOriginDemandId = async (input: DemandeChaleurRenouvelable) => {
  if (!input.originDemandId) {
    return null;
  }

  const originDemand = await kdb
    .selectFrom('demands')
    .select(['id', 'legacy_values'])
    .where('id', '=', input.originDemandId)
    .where('deleted_at', 'is', null)
    .executeTakeFirst();

  const originDemandEmail = originDemand?.legacy_values.Mail?.trim().toLowerCase();
  const inputEmail = input.email.trim().toLowerCase();

  return originDemand?.legacy_values.Status === DEMANDE_STATUS.UNREALISABLE && originDemandEmail === inputEmail ? originDemand.id : null;
};

const notifyCcrtOfNewDemandeChaleurRenouvelable = async ({
  demand,
  demandId,
  departmentCode,
}: {
  demand: DemandeChaleurRenouvelable;
  demandId: string;
  departmentCode: string;
}) => {
  const recipients = await kdb
    .selectFrom('users as u')
    .innerJoin('user_permissions as up', 'up.user_id', 'u.id')
    .select(['u.email', 'u.id', 'u.structure_name'])
    .where('u.active', '=', true)
    .where('u.role', '=', 'ccrt')
    .where('up.type', '=', 'departement')
    .where('up.resource_id', '=', departmentCode)
    .execute();

  const pendingDemandCount = (
    await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(kdb.fn.count<number>('id').as('count'))
      .where('validated', '=', true)
      .where('status', '=', DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS)
      .where('departement_code', '=', departmentCode)
      .executeTakeFirstOrThrow()
  ).count;

  await Promise.all(
    recipients.map(async (recipient) =>
      Promise.all([
        sendEmailTemplate(
          'demands.ccrt.nouvelle-demande-chaleur-renouvelable',
          { email: recipient.email, id: recipient.id },
          {
            demand,
            demandId,
            demandUrl: getCcrtDemandesUrl(demandId),
            pendingDemandCount,
            status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
          }
        ),
        recordCcrtPostHogEvent({
          distinctId: recipient.id,
          event: 'ccrt_demandes:demande_received',
          properties: getCcrtTrackingDemandProperties({
            demandId,
            departmentCode,
            solution1: demand.alternativeHeatingSolutions?.[0],
            structureName: recipient.structure_name,
          }),
        }),
      ])
    )
  );
};

const getDemandeChaleurRenouvelableForCcrtNotification = async (demandId: string) => {
  return await kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select([
      'address',
      'alternative_heating_solutions',
      'annual_heating_consumption',
      'average_area',
      'average_residents',
      'batiment_construction_id',
      'comments',
      'demand_concern',
      'departement_code',
      'dpe',
      'email',
      'first_name',
      'heating_energy',
      'hot_water_system_type',
      'housing_count',
      'housing_type',
      'id',
      'is_public_advisor_selected',
      'last_name',
      'occupant_status',
      'organization_name',
      'origin_demand_id',
      'outdoor_space',
      'phone',
      'project_status',
      'radiator_type',
      'refusal_period',
      'refusal_reason',
      'simulation_url',
      'surface_area',
      'updated_at',
      'validated',
    ])
    .where('id', '=', demandId)
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande chaleur renouvelable introuvable' }));
};

type DemandeChaleurRenouvelableForCcrtNotification = Awaited<ReturnType<typeof getDemandeChaleurRenouvelableForCcrtNotification>>;

const toDemandeChaleurRenouvelableEmailPayload = (demand: DemandeChaleurRenouvelableForCcrtNotification): DemandeChaleurRenouvelable => ({
  address: demand.address,
  alternativeHeatingSolutions: demand.alternative_heating_solutions,
  annualHeatingConsumption: demand.annual_heating_consumption,
  averageArea: demand.average_area,
  averageResidents: demand.average_residents,
  batimentConstructionId: demand.batiment_construction_id,
  comments: demand.comments,
  demandConcern: demand.demand_concern,
  dpe: demand.dpe,
  email: demand.email,
  firstName: demand.first_name,
  heatingEnergy: demand.heating_energy,
  hotWaterSystemType: demand.hot_water_system_type,
  housingCount: demand.housing_count,
  housingType: demand.housing_type,
  isPublicAdvisorSelected: demand.is_public_advisor_selected,
  lastName: demand.last_name,
  occupantStatus: demand.occupant_status,
  organizationName: demand.organization_name,
  originDemandId: demand.origin_demand_id,
  outdoorSpace: demand.outdoor_space,
  phone: demand.phone,
  projectStatus: demand.project_status,
  radiatorType: demand.radiator_type,
  refusalPeriod: demand.refusal_period,
  refusalReason: demand.refusal_reason,
  simulationUrl: demand.simulation_url,
  surfaceArea: demand.surface_area,
});

export const validateDemandeChaleurRenouvelableAdmin = async ({ demandId }: AdminValidateDemandeChaleurRenouvelableInput) => {
  const validationResult = await kdb
    .updateTable('demands_chaleur_renouvelable')
    .set({
      updated_at: new Date(),
      validated: true,
    })
    .where('id', '=', demandId)
    .where('validated', '=', false)
    .returning(['id'])
    .executeTakeFirst();

  const demand = await getDemandeChaleurRenouvelableForCcrtNotification(demandId);

  if (validationResult && demand.departement_code) {
    await notifyCcrtOfNewDemandeChaleurRenouvelable({
      demand: toDemandeChaleurRenouvelableEmailPayload(demand),
      demandId: demand.id,
      departmentCode: demand.departement_code,
    });
  }

  return { id: demand.id, updated_at: demand.updated_at, validated: demand.validated };
};

export const listDemandesChaleurRenouvelableAdmin = async () => {
  const demandes = await selectDemandesChaleurRenouvelableForList().orderBy('created_at', 'desc').execute();

  const { count } = await kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select(kdb.fn.count<number>('id').as('count'))
    .executeTakeFirstOrThrow();

  return { count, items: serializeDemandesChaleurRenouvelable(demandes) };
};

const selectDemandesChaleurRenouvelableForList = () =>
  kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select([
      'address',
      'alternative_heating_solutions',
      'annual_heating_consumption',
      'assigned_to',
      'average_area',
      'average_residents',
      'batiment_construction_id',
      'comments',
      'created_at',
      'demand_concern',
      'departement_code',
      'dpe',
      'email',
      'first_name',
      'heating_energy',
      'hot_water_system_type',
      'housing_count',
      'housing_type',
      'id',
      'is_public_advisor_selected',
      'last_name',
      'occupant_status',
      'outdoor_space',
      'organization_name',
      'phone',
      'project_state',
      'project_status',
      'radiator_type',
      'refusal_period',
      'refusal_reason',
      'rnic_nom_copropriete',
      'rnic_numero_immatriculation',
      'rnic_siret_representant_legal',
      'simulation_url',
      'status',
      'surface_area',
      'updated_at',
      'validated',
    ]);

const serializeDemandesChaleurRenouvelable = <T extends { created_at: Date; updated_at: Date }>(demandes: T[]) =>
  demandes.map((demande) => ({
    ...demande,
    created_at: demande.created_at.toISOString(),
    updated_at: demande.updated_at.toISOString(),
  }));

export const listDemandesChaleurRenouvelableCcrt = async (ctx: Context) => {
  const permissions = await ctx.getPermissions();
  const departmentCodes = permissions.filter((permission) => permission.type === 'departement').map((permission) => permission.resource_id);
  const user = await kdb.selectFrom('users').select(['structure_name']).where('id', '=', ctx.user.id).executeTakeFirst();
  const trackingContext = {
    departements: departmentCodes,
    structure_ccrt: user?.structure_name ?? null,
  };

  if (ctx.user.role !== 'admin' && departmentCodes.length === 0) {
    return { count: 0, items: [], trackingContext };
  }

  const demandes = await selectDemandesChaleurRenouvelableForList()
    .where('validated', '=', true)
    .$if(ctx.user.role !== 'admin', (qb) => qb.where('departement_code', 'in', departmentCodes))
    .orderBy('created_at', 'desc')
    .execute();

  return {
    count: demandes.length,
    items: serializeDemandesChaleurRenouvelable(demandes),
    trackingContext,
  };
};

export const updateDemandeChaleurRenouvelableAdmin = async ({ demandId, values }: AdminUpdateDemandeChaleurRenouvelableInput) => {
  const currentStatus =
    values.status === undefined && values.projectState !== undefined
      ? (
          await kdb
            .selectFrom('demands_chaleur_renouvelable')
            .select('status')
            .where('id', '=', demandId)
            .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande chaleur renouvelable introuvable' }))
        ).status
      : undefined;
  const updatedStatus = values.status ?? currentStatus;

  assertProjectStateCanBeUpdated({
    projectState: values.projectState,
    status: updatedStatus as DemandeChaleurRenouvelableStatus,
  });

  return await kdb
    .updateTable('demands_chaleur_renouvelable')
    .set({
      ...(values.assignedTo !== undefined && { assigned_to: values.assignedTo }),
      ...(values.projectState !== undefined && { project_state: values.projectState }),
      ...(values.status !== undefined &&
        values.status !== DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION && {
          project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
        }),
      ...(values.status !== undefined && { status: values.status }),
      updated_at: new Date(),
    })
    .where('id', '=', demandId)
    .returning(['assigned_to', 'id', 'project_state', 'status', 'updated_at'])
    .executeTakeFirstOrThrow();
};

export const updateDemandeChaleurRenouvelableCcrt = async (
  ctx: Context,
  { demandId, trigger, values }: CcrtUpdateDemandeChaleurRenouvelableInput
) => {
  const permissions = await ctx.getPermissions();
  const departmentCodes = permissions.filter((permission) => permission.type === 'departement').map((permission) => permission.resource_id);

  const currentDemand = await kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select(['alternative_heating_solutions', 'departement_code', 'id', 'project_state', 'status', 'validated'])
    .where('id', '=', demandId)
    .$if(ctx.user.role !== 'admin', (qb) =>
      qb.where('validated', '=', true).where('departement_code', 'in', departmentCodes.length > 0 ? departmentCodes : [''])
    )
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande chaleur renouvelable introuvable' }));

  const updatedStatus = (values.status ?? currentDemand.status) as DemandeChaleurRenouvelableStatus;
  const updatedProjectState =
    values.projectState ??
    getProjectStateForStatus({
      projectState: currentDemand.project_state as DemandeChaleurRenouvelableProjectState,
      status: updatedStatus,
    });

  assertProjectStateCanBeUpdated({
    projectState: values.projectState,
    status: updatedStatus,
  });

  const updatedDemand = await kdb
    .updateTable('demands_chaleur_renouvelable')
    .set({
      ...(values.projectState !== undefined || values.status !== undefined ? { project_state: updatedProjectState } : {}),
      ...(values.status !== undefined && { status: values.status }),
      updated_at: new Date(),
    })
    .where('id', '=', demandId)
    .returning(['id', 'project_state', 'status', 'updated_at'])
    .executeTakeFirstOrThrow(() => new TRPCError({ code: 'NOT_FOUND', message: 'Demande chaleur renouvelable introuvable' }));

  const user = await kdb.selectFrom('users').select(['structure_name']).where('id', '=', ctx.user.id).executeTakeFirst();
  const declenchement = trigger === 'contact' ? 'contact' : ctx.user.role === 'admin' ? 'admin' : 'manual';

  if (values.status !== undefined && currentDemand.status !== values.status) {
    await recordCcrtPostHogEvent({
      distinctId: ctx.user.id,
      event: 'ccrt_demande:status_changed',
      properties: {
        ...getCcrtTrackingDemandProperties({
          demandId,
          departmentCode: currentDemand.departement_code,
          solution1: currentDemand.alternative_heating_solutions[0],
          structureName: user?.structure_name,
        }),
        declenchement,
        statut_apres: values.status,
        statut_avant: currentDemand.status,
        type_statut: 'statut',
      },
    });
  }

  if (values.projectState !== undefined && currentDemand.project_state !== values.projectState) {
    await recordCcrtPostHogEvent({
      distinctId: ctx.user.id,
      event: 'ccrt_demande:status_changed',
      properties: {
        ...getCcrtTrackingDemandProperties({
          demandId,
          departmentCode: currentDemand.departement_code,
          solution1: currentDemand.alternative_heating_solutions[0],
          structureName: user?.structure_name,
        }),
        declenchement,
        statut_apres: values.projectState,
        statut_avant: currentDemand.project_state,
        type_statut: 'etat_projet',
      },
    });
  }

  return updatedDemand;
};

export const notifyCcrtOfUnhandledDemandesChaleurRenouvelable = async (runDate = dayjs().tz('Europe/Paris')) => {
  const recipients = await kdb
    .selectFrom('users as u')
    .innerJoin('user_permissions as up', 'up.user_id', 'u.id')
    .select(['u.email', 'u.id', 'u.structure_name'])
    .select((eb) => [sql<string[]>`array_agg(distinct ${eb.ref('up.resource_id')})`.as('department_codes')])
    .where('u.active', '=', true)
    .where('u.role', '=', 'ccrt')
    .where('u.receive_old_demands', '=', true)
    .where('up.type', '=', 'departement')
    .groupBy(['u.email', 'u.id', 'u.structure_name'])
    .execute();

  await processInParallel(recipients, businessRules.emailSendConcurrency.value, async (recipient) => {
    const demands = await kdb
      .selectFrom('demands_chaleur_renouvelable')
      .select(['address', 'created_at', 'housing_count', 'housing_type', 'id'])
      .where('validated', '=', true)
      .where('status', '=', DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS)
      .where('departement_code', 'in', recipient.department_codes)
      .orderBy('created_at', 'asc')
      .execute();

    if (demands.length === 0) {
      return;
    }

    await sendEmailTemplate(
      'demands.ccrt.rappel-demandes-en-attente',
      { email: recipient.email, id: recipient.id },
      {
        demandListUrl: CCRT_DEMANDES_PATH,
        demands: demands.slice(0, 5).map((demand) => ({
          address: demand.address,
          housingCount: demand.housing_count,
          housingType: demand.housing_type,
          id: demand.id,
          waitingDays: Math.max(0, runDate.diff(dayjs(demand.created_at), 'day')),
        })),
        pendingDemandCount: demands.length,
      },
      {
        subject: `[France Chaleur Urbaine] ${demands.length} demande(s) d'accompagnement en attente de traitement`,
      }
    );
  });

  console.info(`${recipients.length} CCRT vérifié(s) pour les demandes chaleur renouvelable à traiter.`);
};
