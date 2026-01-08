import type { NextApiRequest } from 'next';

import { kdb, sql } from '@/server/db/kysely';
import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';

export default handleRouteErrors(async (req: NextApiRequest) => {
  requireGetMethod(req);

  return await kdb
    .selectFrom('reseaux_de_chaleur')
    .select([
      sql<number[]>`array[min("Taux EnR&R"), max("Taux EnR&R")]`.as('tauxENRR'),
      sql<number[]>`array[min("contenu CO2 ACV") * 1000, max("contenu CO2 ACV") * 1000]`.as('emissionsCO2'),
      sql<number[]>`array[min("contenu CO2") * 1000, max("contenu CO2") * 1000]`.as('contenuCO2'),
      sql<number[]>`array[floor(min("PM")), ceil(max("PM"))]`.as('prixMoyen'),
      sql<number[]>`array[floor(min("livraisons_totale_MWh") / 1000), ceil(max("livraisons_totale_MWh") / 1000)]`.as('livraisonsAnnuelles'),
      sql<number[]>`array[min("annee_creation"), extract(year from now())]`.as('anneeConstruction'), // max = année courante pour indiquer qu'on a des données récentes
    ])
    .executeTakeFirst();
});
