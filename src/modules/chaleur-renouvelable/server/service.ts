import type { BatEnrByBanIdInput, GetAirtableAdeme, GetLocationInput } from '@/modules/chaleur-renouvelable/constants';
import type { BatEnrBatiment } from '@/modules/chaleur-renouvelable/types';
import type { GetBdnbConstructionInput } from '@/modules/tiles/constants';
import { AirtableDB } from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { Airtable } from '@/types/enum/Airtable';
import { fetchJSON } from '@/utils/network';

type BdnbConstructionAddressRelation = {
  batiment_construction_id: string | null;
};

const batEnrBatimentColumns = [
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
] as const;

export const getBatEnrBatimentDetails = async (input: GetBdnbConstructionInput) => {
  if ('batiment_construction_id' in input) {
    const batiment = await kdb
      .selectFrom('bdnb_batenr')
      .select(batEnrBatimentColumns)
      .select(sql<GeoJSON.Geometry | null>`ST_AsGeoJSON(ST_Transform(geom, 4326))::json`.as('geometry'))
      .where('batiment_construction_id', '=', input.batiment_construction_id)
      .executeTakeFirst();

    return batiment;
  }

  const { lat, lon } = input;

  const batiment = await kdb
    .selectFrom('bdnb_batenr')
    .select(batEnrBatimentColumns)
    .select(sql<GeoJSON.Geometry | null>`ST_AsGeoJSON(ST_Transform(geom, 4326))::json`.as('geometry'))
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

  return await kdb
    .selectFrom('bdnb_batenr')
    .select(batEnrBatimentColumns)
    .select(sql<GeoJSON.Geometry | null>`ST_AsGeoJSON(ST_Transform(geom, 4326))::json`.as('geometry'))
    .where('batiment_construction_id', 'in', uniqueBatimentConstructionIds)
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
  const url = `https://api.bdnb.io/v1/bdnb/donnees/rel_batiment_construction_adresse?select=batiment_construction_id&cle_interop_adr=eq.${encodeURIComponent(
    banId
  )}`;

  const data = await fetchJSON<BdnbConstructionAddressRelation[]>(url);
  const batimentConstructionIds = data
    .map((relation) => relation.batiment_construction_id)
    .filter((batimentConstructionId): batimentConstructionId is string => batimentConstructionId !== null);

  return await getBatEnrBatimentsByConstructionIds(batimentConstructionIds);
};

export const addContactToAirtable = async ({ input }: { input: GetAirtableAdeme }) => {
  AirtableDB(Airtable.CONTACT_CHALEUR_RENOUVELABLE).create(input);
};
