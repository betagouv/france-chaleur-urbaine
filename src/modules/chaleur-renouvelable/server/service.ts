import type {
  AdminUpdateDemandeChaleurRenouvelableInput,
  DemandeChaleurRenouvelable,
  GetLocationInput,
} from '@/modules/chaleur-renouvelable/constants';
import type { GetBdnbConstructionInput } from '@/modules/tiles/constants';
import { kdb, sql } from '@/server/db/kysely';
import { fetchJSON } from '@/utils/network';

export const getBatEnrBatimentDetails = async (input: GetBdnbConstructionInput) => {
  if ('batiment_construction_id' in input) {
    const batiment = await kdb
      .selectFrom('bdnb_batenr')
      .select([
        'batiment_construction_id',
        'gmi_nappe_200',
        'gmi_sonde_200',
        'pot_nappe',
        'place_nappe',
        'etat_ppa',
        'ac1',
        'ac2',
        'ac3',
        'ac4',
        'ac4bis',
      ])
      .where('batiment_construction_id', '=', input.batiment_construction_id)
      .executeTakeFirst();

    return batiment;
  }

  const { lat, lon } = input;

  const batiment = await kdb
    .selectFrom('bdnb_batenr')
    .select([
      'batiment_construction_id',
      'gmi_nappe_200',
      'gmi_sonde_200',
      'pot_nappe',
      'place_nappe',
      'etat_ppa',
      'ac1',
      'ac2',
      'ac3',
      'ac4',
      'ac4bis',
    ])
    .where('geom', 'is not', null)
    .orderBy(sql`geom <-> ST_Transform(ST_GeomFromText('POINT(${sql.lit(lon)} ${sql.lit(lat)})', 4326), 2154)`)
    .limit(1)
    .executeTakeFirst();

  return batiment;
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

export const getRnbByBanId = async ({ banId }: { banId: string }) => {
  const url = `https://rnb-api.beta.gouv.fr/api/alpha/buildings/address/?cle_interop_ban=${encodeURIComponent(banId)}`;

  const data = await fetchJSON(url);

  return data.results?.[0];
};

export const createDemandeChaleurRenouvelable = async ({ input }: { input: DemandeChaleurRenouvelable }) => {
  const createdDemand = await kdb
    .insertInto('demands_chaleur_renouvelable')
    .values({
      address: input.address,
      average_area: input.averageArea,
      average_residents: input.averageResidents,
      created_at: new Date(),
      dpe: input.dpe,
      email: input.email,
      first_name: input.firstName,
      heating_energy: input.heatingEnergy,
      housing_count: input.housingCount,
      housing_type: input.housingType,
      last_name: input.lastName,
      occupant_status: input.occupantStatus,
      outdoor_space: input.outdoorSpace,
      phone: input.phone,
      project_status: input.projectStatus,
      simulation_url: input.simulationUrl,
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
      'created_at',
      'dpe',
      'email',
      'first_name',
      'heating_energy',
      'housing_count',
      'housing_type',
      'id',
      'last_name',
      'occupant_status',
      'outdoor_space',
      'phone',
      'project_status',
      'simulation_url',
      'status',
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
