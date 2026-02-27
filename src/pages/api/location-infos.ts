import * as Sentry from '@sentry/nextjs';
import type { NextApiRequest } from 'next';
import { z } from 'zod';

import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors, requirePostMethod, validateObjectSchema } from '@/server/helpers/server';

const zLocationInfos = {
  city: z.string(),
  cityCode: z.string(),
  lat: z.number().optional(),
  lon: z.number().optional(),
};

const maxDistanceThreshold = 1000;

export interface LocationInfoResponse {
  nearestReseauDeChaleur: NearestReseauDeChaleur;
  nearestReseauDeFroid: NearestReseauDeFroid;
  infosVille: InfosVille;
}

export interface NearestReseauDeChaleur {
  'Identifiant reseau': string;
  nom_reseau: string;
  distance: number;
  'contenu CO2': number;
  'contenu CO2 ACV': number;
  'Taux EnR&R': number;
  livraisons_totale_MWh: number;
  production_totale_MWh: number;
  PM: number;
  PM_L: number;
  PM_T: number;
  'PF%': number;
  'PV%': number;
}

export interface NearestReseauDeFroid {
  'Identifiant reseau': string;
  nom_reseau: string;
  distance: number;
  'contenu CO2': number;
  'contenu CO2 ACV': number;
  livraisons_totale_MWh: number;
  production_totale_MWh: number;
}

export interface InfosVille {
  id: string;
  code_postal: string;
  commune: string;
  departement_id: string;
  altitude_moyenne: number;
  temperature_ref_altitude_moyenne: string;
  source: string;
}

export default handleRouteErrors(async (req: NextApiRequest) => {
  requirePostMethod(req);
  const { lon, lat, cityCode, city } = await validateObjectSchema(req.body, zLocationInfos);

  const distanceExpr = sql<number>`round(geom <-> ST_Transform(ST_GeomFromText('POINT(${sql.lit(lon)} ${sql.lit(lat)})', 4326), 2154))`;

  const [nearestReseauDeChaleur, nearestReseauDeFroid, infosVille] = await Promise.all([
    kdb
      .selectFrom('reseaux_de_chaleur')
      .select([
        'Identifiant reseau',
        'nom_reseau',
        distanceExpr.as('distance'),
        'contenu CO2',
        'contenu CO2 ACV',
        'Taux EnR&R',
        'livraisons_totale_MWh',
        'production_totale_MWh',
        'PM',
        'PF%',
        'PV%',
      ])
      .where('has_trace', '=', true)
      .where('nom_reseau', 'is not', null)
      .where(distanceExpr, '<=', maxDistanceThreshold)
      .orderBy(distanceExpr)
      .executeTakeFirst(),
    kdb
      .selectFrom('reseaux_de_froid')
      .select([
        'Identifiant reseau',
        'nom_reseau',
        distanceExpr.as('distance'),
        'contenu CO2',
        'contenu CO2 ACV',
        'livraisons_totale_MWh',
        'production_totale_MWh',
        // les autres valeurs sont manquantes
      ])
      .where('has_trace', '=', true)
      .where('nom_reseau', 'is not', null)
      .where(distanceExpr, '<=', maxDistanceThreshold)
      .orderBy(distanceExpr)
      .executeTakeFirst(),
    kdb
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
      .executeTakeFirst(),
  ]);

  if (!infosVille) {
    const errorMessage = `/api/location-infos. Impossible de trouver la ville: cityCode:"${cityCode}",  city:"${city}"`;
    console.error(errorMessage);
    Sentry.captureException(new Error(errorMessage));
  }

  return {
    infosVille,
    nearestReseauDeChaleur,
    nearestReseauDeFroid,
  };
});
