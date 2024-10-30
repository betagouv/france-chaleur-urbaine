import { multiLineString } from '@turf/helpers';
import turfLength from '@turf/length';
import { NextApiRequest } from 'next';
import { z } from 'zod';

import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@helpers/server';
import db from 'src/db';

export type PointDeConsommation = {
  conso_nb: number;
};

// On garde le détail des consos dans le tableau, car on devrait prochainement retourner des infos sur le bâtiments en plus
// pour mettre à jour les consos ou les exclure du calcul.
export type RawLinearHeatDensity = {
  longueurTotale: number;
  consommationGaz: {
    '10m': PointDeConsommation[];
    '50m': PointDeConsommation[];
  };
  besoinsEnChaleur: {
    '10m': PointDeConsommation[];
    '50m': PointDeConsommation[];
  };
};

const buildNearbyGeometriesFilter = (linesCoords: number[][][], distance: number) => `
  ST_DWithin(
    geom,
    ST_Transform(
      ST_GeomFromText(
        'MULTILINESTRING(
            ${linesCoords.map((lineCoords) => `(${lineCoords.map((coords) => `${coords[0]} ${coords[1]}`).join(', ')})`).join(',')}
        )',
        4326
      ),
      2154
    ),
    ${distance}
  )
`;

export default handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);
  const { coordinates } = await validateObjectSchema(req.query, {
    coordinates: z.preprocess((v) => JSON.parse(decodeURIComponent(v as string)), z.array(z.array(z.array(z.number())))),
  });

  const [consommationGazA10m, consommationGazA50m, besoinsEnChaleurA10m, besoinsEnChaleurA50m] = await Promise.all([
    db('donnees_de_consos')
      .select('conso_nb')
      .where(db.raw(buildNearbyGeometriesFilter(coordinates, 10))),
    db('donnees_de_consos')
      .select('conso_nb')
      .where(db.raw(buildNearbyGeometriesFilter(coordinates, 50))),
    db('besoins_en_chaleur_batiments')
      .select(db.raw('chauf_mwh::integer as conso_nb'))
      .where(db.raw(buildNearbyGeometriesFilter(coordinates, 10))),
    db('besoins_en_chaleur_batiments')
      .select(db.raw('chauf_mwh::integer as conso_nb'))
      .where(db.raw(buildNearbyGeometriesFilter(coordinates, 50))),
  ]);
  return {
    longueurTotale: turfLength(multiLineString(coordinates)),
    consommationGaz: {
      '10m': consommationGazA10m,
      '50m': consommationGazA50m,
    },
    besoinsEnChaleur: { '10m': besoinsEnChaleurA10m, '50m': besoinsEnChaleurA50m },
  } satisfies RawLinearHeatDensity;
});
