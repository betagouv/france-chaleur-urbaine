import { handleRouteErrors } from '@/server/helpers/server';
import { listReseauxEnConstruction } from '@/server/services/network';

const GET = listReseauxEnConstruction;

export type ReseauEnConstruction = Awaited<ReturnType<typeof listReseauxEnConstruction>>[number];

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
