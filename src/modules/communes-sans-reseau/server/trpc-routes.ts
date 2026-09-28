import { route, router } from '@/modules/trpc/server';

import { zCreateDemandeCommuneSansReseauInput } from '../constants';
import { createDemandeCommuneSansReseau } from './service';

export const communesSansReseauRouter = router({
  /** Demande d'accompagnement d'une commune sans réseau (page + iframe potentiel de création de réseau). Public + rate-limité, enregistrée dans Grist. */
  createDemande: route
    .meta({ rateLimit: { limit: 10, windowMs: 60 * 1000 } })
    .input(zCreateDemandeCommuneSansReseauInput)
    .mutation(({ input, ctx }) => createDemandeCommuneSansReseau(input, ctx.logger)),
});
