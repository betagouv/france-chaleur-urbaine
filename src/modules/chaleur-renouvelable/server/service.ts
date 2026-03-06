import type { GetAirtableAdeme, GetLocationInput, GetLonLatInput } from '@/modules/chaleur-renouvelable/constants';
import { getFeatureAtPoint } from '@/modules/chaleur-renouvelable/server/tileHelper';
import type { GetBdnbConstructionInput } from '@/modules/tiles/constants';
import { AirtableDB } from '@/server/db/airtable';
import { kdb, sql } from '@/server/db/kysely';
import { Airtable } from '@/types/enum/Airtable';
import { fetchJSON } from '@/utils/network';

export const getBatEnrBatimentDetails = async ({ batiment_construction_id }: GetBdnbConstructionInput) => {
  const batiment = await kdb
    .selectFrom('bdnb_batenr')
    .select(['batiment_groupe_id', 'gmi_nappe_200', 'gmi_sonde_200', 'etat_ppa'])
    .where('batiment_construction_id', '=', batiment_construction_id)
    .executeTakeFirstOrThrow();

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

export const isGeothermiePossible = async ({ lon, lat }: GetLonLatInput) => {
  const featureNappe = await getFeatureAtPoint('ressources-geothermales-nappes', lon, lat);

  // 7 correspond à "Moyen"
  if (Number(featureNappe?.properties?.pot_value) > 7) {
    return true;
  }

  // 11 est le zoom maximum pour ces tiles
  const featureProfonde = await getFeatureAtPoint('enrr-mobilisables-zones-geothermie-profonde', lon, lat, 11);
  // Si featureProfonde est nulle, il n'y a pas de zone de geothermie identifié à ces coordonnées
  return featureProfonde != null;
};
