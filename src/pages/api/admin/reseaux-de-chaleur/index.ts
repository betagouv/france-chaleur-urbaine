import { handleRouteErrors } from '@/server/helpers/server';
import { listReseauxDeChaleur } from '@/server/services/network';

const GET = listReseauxDeChaleur;

export type ReseauDeChaleur = Awaited<ReturnType<typeof listReseauxDeChaleur>>[number];

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
