import { EMPTY_BAT_ENR_INFO, getBatEnrInfoFromBatiment } from '@/modules/chaleur-renouvelable/bat-enr';
import type {
  AddressEligibilityContextInput,
  AdminUpdateDemandeChaleurRenouvelableInput,
  BatEnrBatiment,
  BatEnrBatimentsSelectionContext,
  BatEnrByBanIdInput,
  DemandeChaleurRenouvelable,
  DemandeChaleurRenouvelableStatus,
  FranceRenovSpace,
  FranceRenovSpaceInput,
  GetLocationInput,
} from '@/modules/chaleur-renouvelable/constants';
import {
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_ALEC,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_CCR,
} from '@/modules/chaleur-renouvelable/constants';
import type { CreateDemandInput, DemandSubmissionResult } from '@/modules/demands/constants';
import { createDemand } from '@/modules/demands/server/creation-user';
import { sendEmailTemplate } from '@/modules/email';
import type { GetBdnbConstructionInput } from '@/modules/tiles/constants';
import { serverConfig } from '@/server/config';
import { kdb, sql } from '@/server/db/kysely';
import { getEligilityStatus } from '@/server/services/addresseInformation';
import { fetchJSON } from '@/utils/network';

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

const DEMANDE_CHALEUR_RENOUVELABLE_NOTIFICATION_EMAIL = 'france.chaleur.urbaine@gmail.com';
const BAT_ENR_PRESELECTED_BUILDING_RADIUS_METERS = 200;
const FRANCE_RENOV_SPACES_RESOURCE_ID = 'bc99b9d4-1b70-48e1-9958-98cceacd0c93';

type BanAddressSearchResponse = {
  features: {
    properties: {
      citycode: string;
    };
  }[];
};

type FranceRenovSpaceRow = {
  'Adresse Structure': string;
  'Code Postal Structure': string;
  'Commune Structure': string;
  'Email Structure': string;
  'Nom Structure': string;
  'Site Internet Structure': string | null;
  'Telephone Structure': string;
  'Telephone 2 Structure': string | null;
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

const getInitialDemandeChaleurRenouvelableStatus = (input: DemandeChaleurRenouvelable): DemandeChaleurRenouvelableStatus => {
  return input.housingType === 'maison_individuelle' ||
    input.housingType === 'immeuble_chauffage_individuel' ||
    input.demandConcern === 'Une maison individuelle'
    ? DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_ALEC
    : DEMANDE_CHALEUR_RENOUVELABLE_STATUS_WAITING_CCR;
};

const getDemandAddressTerritory = (context: string) => {
  const [department = '', , region = ''] = context.split(',').map((contextPart) => contextPart.trim());

  return { department, region };
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

const createRaccordableDemand = async (input: DemandeChaleurRenouvelable): Promise<DemandSubmissionResult | null> => {
  if (input.isPublicAdvisorSelected || !input.geoAddress || !input.heatNetworkEligibility) {
    return null;
  }

  const [lon, lat] = input.geoAddress.coordinates;
  const { department, region } = getDemandAddressTerritory(input.geoAddress.context);
  const demandStructure = getDemandStructure(input);
  const organizationName = input.organizationName ?? '';

  return await createDemand(
    {
      address: input.address,
      city: input.geoAddress.city,
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
    .select(['departement_id', 'temperature_ref_altitude_moyenne'])
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

export const getAddressEligibilityContext = async (input: AddressEligibilityContextInput) => {
  const [batEnrLookup, infos, eligibiliteReseauChaleur] = await Promise.all([
    getBatEnrLookupResult(input),
    getLocationInfos({ city: input.city, cityCode: input.cityCode }),
    getEligilityStatus(input.lat, input.lon),
  ]);

  return {
    batEnr: batEnrLookup.batEnr,
    batEnrBatiments: batEnrLookup.batEnrBatiments,
    codeDepartement: infos?.departement_id ?? '',
    eligibiliteReseauChaleur,
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

  const result = await fetchJSON<{ data: FranceRenovSpaceRow[] }>(
    `https://tabular-api.data.gouv.fr/api/resources/${FRANCE_RENOV_SPACES_RESOURCE_ID}/data/`,
    {
      params: {
        'Code Insee Commune__exact': cityCode,
        page_size: '1',
      },
    }
  );

  return result.data[0] ? toFranceRenovSpace(result.data[0]) : null;
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

const toFranceRenovSpace = (row: FranceRenovSpaceRow): FranceRenovSpace => ({
  address: row['Adresse Structure'].trim(),
  city: row['Commune Structure'],
  email: row['Email Structure'],
  name: row['Nom Structure'],
  phone: row['Telephone Structure'],
  secondaryPhone: row['Telephone 2 Structure'],
  website: row['Site Internet Structure'],
  zipcode: row['Code Postal Structure'],
});

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
  const initialStatus = getInitialDemandeChaleurRenouvelableStatus(input);

  const createdDemand = await kdb
    .insertInto('demands_chaleur_renouvelable')
    .values({
      address: input.address,
      average_area: input.averageArea,
      average_residents: input.averageResidents,
      batiment_construction_id: input.batimentConstructionId,
      comments: input.comments,
      created_at: new Date(),
      demand_concern: input.demandConcern,
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
      outdoor_space: input.outdoorSpace,
      phone: input.phone,
      project_status: input.projectStatus,
      radiator_type: input.radiatorType,
      refusal_period: input.refusalPeriod,
      refusal_reason: input.refusalReason,
      simulation_url: input.simulationUrl,
      status: initialStatus,
      surface_area: input.surfaceArea,
      updated_at: new Date(),
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  await sendEmailTemplate(
    'demands.equipe-fcu.nouvelle-demande-chaleur-renouvelable',
    { email: DEMANDE_CHALEUR_RENOUVELABLE_NOTIFICATION_EMAIL },
    {
      demand: input,
      demandId: createdDemand.id,
      status: initialStatus,
    }
  );

  const demandSubmissionResult = await createRaccordableDemand(input);

  return {
    demandSubmissionResult,
    id: createdDemand.id,
  };
};

export const listDemandesChaleurRenouvelableAdmin = async () => {
  const demandes = await kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select([
      'address',
      'assigned_to',
      'average_area',
      'average_residents',
      'batiment_construction_id',
      'comments',
      'created_at',
      'demand_concern',
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
      'project_status',
      'radiator_type',
      'refusal_period',
      'refusal_reason',
      'simulation_url',
      'status',
      'surface_area',
      'updated_at',
    ])
    .orderBy('created_at', 'desc')
    .execute();

  const { count } = await kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select(kdb.fn.count<number>('id').as('count'))
    .executeTakeFirstOrThrow();

  const items = demandes.map((demande) => ({
    ...demande,
    created_at: demande.created_at.toISOString(),
    updated_at: demande.updated_at.toISOString(),
  }));

  return { count, items };
};

export const updateDemandeChaleurRenouvelableAdmin = async ({ demandId, values }: AdminUpdateDemandeChaleurRenouvelableInput) => {
  return await kdb
    .updateTable('demands_chaleur_renouvelable')
    .set({
      ...(values.assignedTo !== undefined && { assigned_to: values.assignedTo }),
      ...(values.status !== undefined && { status: values.status }),
      updated_at: new Date(),
    })
    .where('id', '=', demandId)
    .returning(['assigned_to', 'id', 'status', 'updated_at'])
    .executeTakeFirstOrThrow();
};
