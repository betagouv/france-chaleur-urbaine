import type { NextApiRequest, NextApiResponse } from 'next';
import db from 'src/db';

type DPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'N';

export default async function users(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { lat, lon, distance } = req.query as Record<string, string>;

      if (!lat || !lon) {
        res.status(400).json({
          message: 'Parameters lat and lon are required',
          code: 'Bad Arguments',
        });
        return;
      }

      let distanceInMeters = Number.parseInt(distance, 10);
      if (Number.isNaN(distanceInMeters)) {
        distanceInMeters = 10000;
      }

      const regions = await db('regions')
        .select('bnb_nom')
        .where(
          db.raw(`
            ST_Intersects(
              ST_Transform(geom, 2154),
              ST_BUFFER(ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154), ${distanceInMeters})
              )
          `)
        );

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

      for (let r = 0; r < regions.length; r++) {
        const region = regions[r].bnb_nom;
        const dpeRegion = await db(region)
          .select(
            db.raw(
              `
              dpe_mix_arrete_classe_bilan_dpe,
              dpe_mix_arrete_classe_emission_ges
            `
            )
          )
          .where(
            db.raw(`
            dpe_mix_arrete_classe_bilan_dpe is not null
            and dpe_mix_arrete_classe_emission_ges is not null
            and ST_Intersects(
              ST_Transform(geom, 2154),
              ST_BUFFER(ST_Transform('SRID=4326;POINT(${lon} ${lat})'::geometry, 2154), ${distanceInMeters})
              )
          `)
          );
        dpeRegion.forEach((dpe) => {
          dpes.count++;
          dpes.dpeEnergie[dpe.dpe_mix_arrete_classe_bilan_dpe as DPE] += 1;
          dpes.dpeGES[dpe.dpe_mix_arrete_classe_emission_ges as DPE] += 1;
        });
      }

      return res.status(200).json(dpes);
    }

    return res.status(501);
  } catch (error) {
    console.error(error);
    res.statusCode = 500;
    return res.json({
      message: 'internal server error',
      code: 'Internal Server Error',
    });
  }
}
