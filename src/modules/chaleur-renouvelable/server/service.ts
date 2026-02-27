import type { GetLocationInput } from '@/modules/chaleur-renouvelable/constants';
import type { GetBdnbConstructionInput } from '@/modules/tiles/constants';
import { kdb, sql } from '@/server/db/kysely';

export const getBatEnrBatimentDetails = async ({ batiment_construction_id }: GetBdnbConstructionInput) => {
  const batiment = await kdb
    .selectFrom('bdnb_batenr')
    .select([
      'batiment_groupe_id',
      'gmi_nappe_200',
      'pot_nappe',
      'place_nappe',
      'gmi_sonde_200',
      'gis_geo_profonde',
      'ac1',
      'ac2',
      'ac3',
      'ac4',
      'ac4bis',
      'liste_ppa',
      'etat_ppa',
    ])
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
