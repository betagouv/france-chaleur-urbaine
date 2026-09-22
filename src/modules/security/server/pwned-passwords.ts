import { createHash } from 'node:crypto';

import { serverConfig } from '@/server/config';
import { logger } from '@/server/helpers/logger';
import { BadRequestError } from '@/server/helpers/server';

const PWNED_PASSWORDS_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const REQUEST_TIMEOUT_MS = 3000;

export const PWNED_PASSWORD_MESSAGE =
  'Ce mot de passe apparaît dans des fuites de données publiques. Choisissez-en un autre, par exemple une phrase facile à retenir.';

export type PwnedPasswordCheckContext = 'register' | 'reset_password';

/**
 * Number of known data breaches containing this password, via the Have I Been Pwned k-anonymity API:
 * only the first 5 hex characters of the SHA-1 leave the server, the match is done locally on the returned range.
 * Throws when the API is unreachable or answers an error.
 */
export const countPasswordLeaks = async (password: string, fetchImpl: typeof fetch = fetch): Promise<number> => {
  const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  const response = await fetchImpl(`${PWNED_PASSWORDS_RANGE_URL}${prefix}`, {
    headers: { 'Add-Padding': 'true', 'User-Agent': 'france-chaleur-urbaine' }, // padding hides the real range size from network observers
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`pwned passwords API responded ${response.status}`);
  }

  const body = await response.text();
  for (const line of body.split('\n')) {
    const [lineSuffix, count] = line.trim().split(':');
    if (lineSuffix === suffix) {
      return Number(count) || 0; // padding entries come with a count of 0
    }
  }
  return 0;
};

/**
 * Rejects a password known in public data breaches (registration, password reset).
 * Fails open: when the API is unavailable the password is accepted and the outage is logged,
 * so a third-party incident never blocks account creation.
 */
export const ensurePasswordNotPwned = async (password: string, context: PwnedPasswordCheckContext): Promise<void> => {
  if (!serverConfig.PWNED_PASSWORDS_CHECK_ENABLED) {
    return;
  }

  let leaks: number;
  try {
    leaks = await countPasswordLeaks(password);
  } catch (error) {
    logger.warn('pwned passwords check unavailable', { context, error: error instanceof Error ? error.message : String(error) });
    return;
  }

  if (leaks > 0) {
    logger.warn('pwned password rejected', { context, leaks });
    throw new BadRequestError(PWNED_PASSWORD_MESSAGE);
  }
};
