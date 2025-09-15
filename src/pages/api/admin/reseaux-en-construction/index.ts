import { listReseauxEnConstruction } from '@/modules/reseaux/server/service';
import { handleRouteErrors } from '@/server/helpers/server';

const GET = listReseauxEnConstruction;

export type ReseauEnConstruction = Awaited<ReturnType<typeof listReseauxEnConstruction>>[number];

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
