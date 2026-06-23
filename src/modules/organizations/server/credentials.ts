import { createHash, randomBytes } from 'node:crypto';

const TOKEN_PREFIX = 'fcu_';
const TOKEN_BYTES = 32;

/** Génère un token API opaque, montré une seule fois au gestionnaire. */
export const generateApiToken = (): string => `${TOKEN_PREFIX}${randomBytes(TOKEN_BYTES).toString('base64url')}`;

/**
 * Hash déterministe (sha256) stocké en base : permet le lookup par index unique sur `token_hash`.
 * Le token en clair n'est jamais persisté.
 */
export const hashApiToken = (token: string): string => createHash('sha256').update(token).digest('hex');
