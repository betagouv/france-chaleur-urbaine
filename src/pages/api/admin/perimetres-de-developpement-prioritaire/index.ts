import { handleRouteErrors } from '@/server/helpers/server';
import { listPerimetresDeDeveloppementPrioritaire } from '@/server/services/network';

const GET = listPerimetresDeDeveloppementPrioritaire;

export type PerimetreDeDeveloppementPrioritaire = Awaited<ReturnType<typeof listPerimetresDeDeveloppementPrioritaire>>[number];

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
