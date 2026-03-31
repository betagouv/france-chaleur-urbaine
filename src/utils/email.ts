/**
 * Pseudonymizes an email address for safe logging.
 * Keeps the first and last character of the local part and of the first domain label,
 * replacing the rest with "...".
 *
 * All domain labels are pseudonymized except the TLD (last label).
 *
 * @example
 * pseudonymizeEmail('maxime@france-chaleur-urbaine.fr')      // 'm...e@f...e.fr'
 * pseudonymizeEmail('jane.doe@alice.fr')                     // 'j...e@a...e.fr'
 * pseudonymizeEmail('test@developpement-durable.gouv.fr')    // 't...t@d...e.g...v.fr'
 * pseudonymizeEmail('test@sub.example.co.uk')                // 't...t@s...b.e...e.c...o.uk'
 */
export function pseudonymizeEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const mask = (s: string) => (s.length <= 1 ? s : `${s[0]}...${s[s.length - 1]}`);
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  const pseudoDomain = [...domainParts.slice(0, -1).map(mask), tld].join('.');
  return `${mask(local)}@${pseudoDomain}`;
}
