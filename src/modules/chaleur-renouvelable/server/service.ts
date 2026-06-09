import type {
  AdminUpdateDemandeChaleurRenouvelableInput,
  BatEnrBatiment,
  BatEnrByBanIdInput,
  DemandeChaleurRenouvelable,
  GetLocationInput,
} from '@/modules/chaleur-renouvelable/constants';
import type { GetBdnbConstructionInput } from '@/modules/tiles/constants';
import { serverConfig } from '@/server/config';
import { kdb, sql } from '@/server/db/kysely';
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

  return await getBatEnrBatimentsByConstructionIds(batimentConstructionIds);
};

export const createDemandeChaleurRenouvelable = async ({ input }: { input: DemandeChaleurRenouvelable }) => {
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
      surface_area: input.surfaceArea,
      updated_at: new Date(),
    })
    .returning(['id'])
    .executeTakeFirstOrThrow();

  return createdDemand;
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
