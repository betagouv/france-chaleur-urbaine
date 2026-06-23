import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';

import { findOrganizationByToken, touchCredentialLastUsed } from '@/modules/organizations/server/service';
import type { Permission } from '@/modules/permissions/types';
import { createNextApiRateLimiter } from '@/modules/security/server/rate-limit/next-pages';
import { handleRouteErrors, invalidRouteError, requiredAuthenticationError } from '@/server/helpers/server';

/** Contexte résolu d'un appel partenaire authentifié (1 token = 1 organisation). */
export type PartnerAuth = { organizationId: string; organizationName: string; credentialId: string };

export type PartnerApiHandler<TReturn = unknown> = (req: NextApiRequest, res: NextApiResponse, auth: PartnerAuth) => Promise<TReturn>;

// Rate limit par IP avant l'auth (protège le lookup token). Généreux pour du polling : 60 req/min.
const partnerRateLimiter = createNextApiRateLimiter({ limit: 60, path: 'api/v2/demands', windowMs: 60_000 });

const BEARER_PREFIX = 'Bearer ';

const extractBearerToken = (req: NextApiRequest): string | null => {
  const header = req.headers.authorization;
  if (!header?.startsWith(BEARER_PREFIX)) return null;
  return header.slice(BEARER_PREFIX.length).trim() || null;
};

/**
 * Résout le token `Authorization: Bearer fcu_…` en organisation. Lève une 401 si absent/invalide/révoqué.
 * Met à jour `last_used_at` (au plus 1×/min) sur le credential utilisé.
 */
export const authenticatePartner = async (req: NextApiRequest): Promise<PartnerAuth> => {
  const token = extractBearerToken(req);
  if (!token) throw requiredAuthenticationError;

  const org = await findOrganizationByToken(token);
  if (!org) throw requiredAuthenticationError;

  await touchCredentialLastUsed(org.credential_id);
  return { credentialId: org.credential_id, organizationId: org.organization_id, organizationName: org.organization_name };
};

/**
 * Accès demandes à l'échelle organisation : la permission synthétique `organization` réutilise `buildDemandAccessFilter`
 * et les matchers. Le rôle `gestionnaire` est requis, sinon le filtre court-circuite en `false`.
 */
export const buildOrgAccess = (organizationId: string): { user: { id: string; role: 'gestionnaire' }; permissions: Permission[] } => ({
  permissions: [{ resource_id: organizationId, type: 'organization' }],
  user: { id: `org:${organizationId}`, role: 'gestionnaire' },
});

/**
 * Enveloppe une route `/api/v2/demands` : rate-limit → auth Bearer → dispatch par méthode HTTP.
 * Réutilise `handleRouteErrors` (mapping 400/401/404/429/500 + Sentry).
 */
export const withPartnerApi = (handlers: Partial<Record<'GET' | 'PATCH', PartnerApiHandler>>): NextApiHandler =>
  handleRouteErrors(async (req, res) => {
    await partnerRateLimiter(req, res);
    const auth = await authenticatePartner(req);
    const handler = handlers[req.method as 'GET' | 'PATCH'];
    if (!handler) throw invalidRouteError;
    return handler(req, res, auth);
  });
