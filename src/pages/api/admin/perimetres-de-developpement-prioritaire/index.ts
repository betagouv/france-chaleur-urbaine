import { listPerimetresDeDeveloppementPrioritaire } from '@/modules/reseaux/server/service';
import { handleRouteErrors } from '@/server/helpers/server';

const GET = listPerimetresDeDeveloppementPrioritaire;

export type PerimetreDeDeveloppementPrioritaire = Awaited<ReturnType<typeof listPerimetresDeDeveloppementPrioritaire>>[number];

export default handleRouteErrors(
  { GET },
  {
    requireAuthentication: ['admin'],
  }
);
