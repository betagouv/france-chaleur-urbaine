import type { NextApiRequest } from 'next';
import { z } from 'zod';

import db from '@/server/db';
import { handleRouteErrors, requireGetMethod, validateObjectSchema } from '@/server/helpers/server';

type DPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'N';

export default handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  const { lat, lon, distance } = await validateObjectSchema(req.query, {
    distance: z.coerce.number().default(10000),
    lat: z.coerce.number(),
    lon: z.coerce.number(),
  });

  const regions = (await db('regions')
    .select('bnb_nom')
    .whereRaw(
      `
    ST_DWithin(
      ST_Transform(ST_SetSRID(ST_Point(:lon, :lat), 4326), 2154),
      geom,
      :distance
    )
  `,
      { distance, lat, lon }
    )) as { bnb_nom: string }[];

  const dpes = {
    count: 0,
    dpeEnergie: {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
      G: 0,
      N: 0,
    },
    dpeGES: {
      A: 0,
      B: 0,
      C: 0,
      D: 0,
      E: 0,
      F: 0,
      G: 0,
      N: 0,
    },
  };

  await Promise.all(
    regions.map(async (region) => {
      const dpeRegion = await db(region.bnb_nom)
        .select('dpe_mix_arrete_classe_bilan_dpe', 'dpe_mix_arrete_classe_emission_ges')
        .whereRaw(
          `
              dpe_mix_arrete_classe_bilan_dpe is not null
              and dpe_mix_arrete_classe_emission_ges is not null
              and ST_DWithin(
                ST_Transform(ST_SetSRID(ST_Point(:lon, :lat), 4326), 2154),
                geom,
                :distance
              )
            `,
          { distance, lat, lon }
        );
      dpeRegion.forEach((dpe) => {
        dpes.count++;
        dpes.dpeEnergie[dpe.dpe_mix_arrete_classe_bilan_dpe as DPE] += 1;
        dpes.dpeGES[dpe.dpe_mix_arrete_classe_emission_ges as DPE] += 1;
      });
    })
  );

  return dpes;
});
