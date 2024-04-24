import { handleRouteErrors, requireGetMethod } from '@helpers/server';
import type { NextApiRequest } from 'next';
import db from 'src/db';

export default handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  return await db('reseaux_de_chaleur')
    .select(
      db.raw(`array[min("Taux EnR&R"), max("Taux EnR&R")] as "tauxENRR"`),
      db.raw(
        `array[min("contenu CO2 ACV") * 1000, max("contenu CO2 ACV") * 1000] as "emissionsCO2"`
      ),
      db.raw(`array[floor(min("PM")), ceil(max("PM"))] as "prixMoyen"`),
      db.raw(
        `array[min("annee_creation"), max("annee_creation")] as "anneeConstruction"`
      )
    )
    .first();
});
