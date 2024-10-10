import type { NextApiRequest } from 'next';

import { handleRouteErrors, requireGetMethod } from '@helpers/server';
import db from 'src/db';

export default handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  return await db('reseaux_de_chaleur')
    .select(
      db.raw(`array[min("Taux EnR&R"), max("Taux EnR&R")] as "Taux EnR&R"`),
      db.raw(`array[min("contenu CO2 ACV") * 1000, max("contenu CO2 ACV") * 1000] as "contenu CO2 ACV"`),
      db.raw(`array[min("contenu CO2") * 1000, max("contenu CO2") * 1000] as "contenu CO2"`),
      db.raw(`array[floor(min("PM")), ceil(max("PM"))] as "PM"`),
      db.raw(`array[floor(min("livraisons_totale_MWh") / 1000), ceil(max("livraisons_totale_MWh") / 1000)] as "livraisons_totale_MWh"`),
      db.raw(
        `array[min("annee_creation"), extract(year from now())] as "annee_creation"` // max = année courante pour indiquer qu'on a des données récentes
      )
    )
    .first();
});
