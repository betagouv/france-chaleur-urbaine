import { NextApiRequest } from 'next';
import { z } from 'zod';

import { handleRouteErrors, requirePostMethod, validateObjectSchema } from '@helpers/server';
import db from 'src/db';

const zLocationInfos = {
  lon: z.number(),
  lat: z.number(),
  city: z.string(),
  cityCode: z.string(),
};

export default handleRouteErrors(async (req: NextApiRequest) => {
  requirePostMethod(req);
  const { lon, lat, cityCode, city } = await validateObjectSchema(req.body, zLocationInfos);

  const distanceSubQuery = `round(geom <-> ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154))`;
  const [nearestReseauDeChaleur, nearestReseauDeFroid, infosVilles] = await Promise.all([
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
        'PM_L',
        'PM_T',
        'PF%',
        'PV%'
      )
      .where('has_trace', true)
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
      .orderByRaw(distanceSubQuery)
      .first(),
    db('communes').where('id', cityCode).orWhere('commune', city.toUpperCase()).first(),
  ]);

  return {
    nearestReseauDeChaleur,
    nearestReseauDeFroid,
    infosVilles,
  };
});
