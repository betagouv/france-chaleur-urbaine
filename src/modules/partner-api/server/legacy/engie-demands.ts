import type { NextApiRequest, NextApiResponse } from 'next';

import { createEvent } from '@/modules/events/server/service';
import { buildDemandAccessFilter } from '@/modules/permissions/server/service';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { sql } from '@/server/db/kysely';
import { handleRouteErrors, requireGetMethod } from '@/server/helpers/server';
import { withCors } from '@/services/api/cors';

import { authenticatePartner, buildOrgAccess } from '../authentication';
import { toDemandDTO } from '../dto';
import { baseDemandQuery } from '../handlers';

// Rate limit par IP (parité avec l'API v2 partenaire) : 60 req/min.
const rateLimiter = createNextApiRateLimiter({ limit: 60, path: 'api/v1/demands', windowMs: 60_000 });

/**
 * `GET /api/v1/demands/{key}` — API héritée ENGIE, à décommissionner. Auth par token d'organisation
 * (`organization_api_credentials`, comme la v2) ; le `[key]` de l'URL est ignoré. Demandes de l'organisation
 * reprojetées au format v1. `network` = SNCU du réseau affecté (`null` si construction / aucun).
 */
const handler = handleRouteErrors(async (req: NextApiRequest, res: NextApiResponse) => {
  requireGetMethod(req);
  await rateLimiter(req, res);
  const auth = await authenticatePartner(req);

  const { user, permissions } = buildOrgAccess(auth.organizationId);
  const rows = await buildDemandAccessFilter(
    user,
    permissions
  )(baseDemandQuery())
    .orderBy(sql`legacy_values->>'Date de la demande'`, 'desc')
    .execute();

  // Audit : trace chaque récupération de demandes via l'API v1 (author_id null, contexte organisation).
  await createEvent({
    context_id: auth.organizationId,
    context_type: 'organization',
    data: {
      count: rows.length,
      credential_id: auth.credentialId,
      organization_id: auth.organizationId,
      organization_name: auth.organizationName,
      updated_since: null,
      version: 'v1',
    },
    type: 'api_demands_listed',
  });

  return rows.map((row) => {
    const dto = toDemandDTO(row);
    return {
      address: dto.localisation.adresse,
      buildingType: dto.batiment.type_structure,
      date: dto.date_creation,
      distance: dto.eligibilite.distance_reseau_m === null ? null : String(dto.eligibilite.distance_reseau_m),
      id: dto.id,
      network: dto.reseau.identifiant_sncu,
    };
  });
});

export default withCors(handler);
