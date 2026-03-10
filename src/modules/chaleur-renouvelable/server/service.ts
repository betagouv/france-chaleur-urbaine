import type { GetAirtableAdeme, GetLocationInput } from '@/modules/chaleur-renouvelable/constants';
import type { GetBdnbConstructionInput } from '@/modules/tiles/constants';
import { AirtableDB } from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { Airtable } from '@/types/enum/Airtable';
import { fetchJSON } from '@/utils/network';

export const getBatEnrBatimentDetails = async (input: GetBdnbConstructionInput) => {
  if ('batiment_construction_id' in input) {
    const batiment = await kdb
      .selectFrom('bdnb_batenr')
      .select(['batiment_construction_id', 'gmi_nappe_200', 'gmi_sonde_200', 'etat_ppa'])
      .where('batiment_construction_id', '=', input.batiment_construction_id)
      .executeTakeFirst();

    return batiment;
  }

  const { lat, lon } = input;

  const batiment = await kdb
    .selectFrom('bdnb_batenr')
    .select(['batiment_construction_id', 'gmi_nappe_200', 'gmi_sonde_200', 'etat_ppa'])
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

export const addContactToAirtable = async ({ input }: { input: GetAirtableAdeme }) => {
  AirtableDB(Airtable.CONTACT_CHALEUR_RENOUVELABLE).create(input);
};
