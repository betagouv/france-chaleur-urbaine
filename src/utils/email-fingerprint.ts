import { createHash } from 'node:crypto';

/**
 * Short non-reversible identifier of an email address, for logs and analytics where the address itself must not appear.
 */
export const emailFingerprint = (email: string): string =>
  createHash('sha256').update(email.trim().toLowerCase()).digest('hex').slice(0, 12);
