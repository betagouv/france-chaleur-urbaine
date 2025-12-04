import * as Sentry from '@sentry/nextjs';
import type { NextApiRequest } from 'next';
import { z } from 'zod';

import db from '@/server/db';
import { handleRouteErrors, requirePostMethod, validateObjectSchema } from '@/server/helpers/server';

const zLocationInfos = {
  city: z.string(),
  cityCode: z.string(),
  lat: z.number(),
  lon: z.number(),
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

  const distanceSubQuery = `round(geom <-> ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154))`;

  const [nearestReseauDeChaleur, nearestReseauDeFroid, infosVille] = await Promise.all([
    db('reseaux_de_chaleur')
      .select(
        'Identifiant reseau',
        'nom_reseau',
        db.raw(`${distanceSubQuery} as distance`),
        'contenu CO2',
        'contenu CO2 ACV',
        'Taux EnR&R',
        'livraisons_totale_MWh',
        'production_totale_MWh',
        'PM',
        'PF%',
        'PV%'
      )
      .where('has_trace', true)
      .whereNotNull('nom_reseau')
      .whereRaw(`${distanceSubQuery} <= ${maxDistanceThreshold}`)
      .orderByRaw(distanceSubQuery)
      .first(),
    db('reseaux_de_froid')
      .select(
        'Identifiant reseau',
        'nom_reseau',
        db.raw(`${distanceSubQuery} as distance`),
        'contenu CO2',
        'contenu CO2 ACV',
        'livraisons_totale_MWh',
        'production_totale_MWh'
        // les autres valeurs sont manquantes
      )
      .where('has_trace', true)
      .whereNotNull('nom_reseau')
      .whereRaw(`${distanceSubQuery} <= ${maxDistanceThreshold}`)
      .orderByRaw(distanceSubQuery)
      .first(),
    db('communes')
      .select('departement_id', 'temperature_ref_altitude_moyenne')
      .where(
        'id',
        db.raw(
          `COALESCE(
            (SELECT id FROM communes WHERE id = ?),
            (SELECT id FROM communes WHERE commune = ?),
            (SELECT id FROM communes WHERE commune LIKE ?)
          )`,
          [cityCode, city.toUpperCase(), `${city.toUpperCase()}-%-ARRONDISSEMENT`]
        )
      )
      .first(),
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
