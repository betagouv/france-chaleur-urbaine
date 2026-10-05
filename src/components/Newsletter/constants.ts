/** ADEME-hosted newsletter signup page: every newsletter entry point on the site links here. */
export const NEWSLETTER_SIGNUP_URL = 'https://cloud.contact.ademe.fr/france-chaleur-urbaine';

/** Placement of a newsletter link, sent to PostHog to compare entry points. */
export const newsletterLinkSources = [
  'collectivites',
  'professionnels',
  'webinaires',
  'actus-intro',
  'actus-article',
  'bloc-actus',
  'accueil',
  'footer',
] as const;
export type NewsletterLinkSource = (typeof newsletterLinkSources)[number];

/** Accessible label of a link opening the ADEME page in a new tab (RGAA 13.2). */
export const getNewsletterLinkTitle = (label: string) => `${label} – nouvelle fenêtre`;
