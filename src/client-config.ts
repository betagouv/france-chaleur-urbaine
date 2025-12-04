// Attention, il faut référencer explicitement chaque variable process.env.NEXT_PUBLIC_*

import { envBooleanSchema } from '@/utils/validation';

// exemple: ENABLE_INSCRIPTIONS: envBooleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_INSCRIPTIONS),
export const clientConfig = {
  banApiBaseUrl: process.env.NEXT_PUBLIC_BAN_API_BASE_URL ?? 'https://api-adresse.data.gouv.fr/search/',
  calendarLink: 'https://cal.com/erwangravez/15min',
  contactEmail: 'france.chaleur.urbaine@ademe.fr', // changer également dans openapi-schema.yaml
  destinationEmails: Object.entries({
    carto: 'laetitia.gabreau@beta.gouv.fr',
    comparateur: 'rbeaulieu@amorce.asso.fr,dponcet@elcimai.com',
    contact: 'erwan.gravez@beta.gouv.fr,laetitia.gabreau@beta.gouv.fr',
    contribution: 'laetitia.gabreau@beta.gouv.fr',
    pro: 'erwan.gravez@beta.gouv.fr',
  }).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: `${value},france-chaleur-urbaine@developpement-durable.gouv.fr,france.chaleur.urbaine@ademe.fr`,
    }),
    {} as Record<string, string>
  ),
  flags: {
    enableComparateurWidget: envBooleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR_WIDGET),
  },
  linkedInUrl: 'https://www.linkedin.com/company/france-chaleur-urbaine?originalSubdomain=fr',
  networkInfoFieldMaxCharacters: 700,
  networkSearchMinimumCharactersThreshold: 3,
  publicodesDocumentationURL:
    process.env.NEXT_PUBLIC_PUBLICODES_DOCUMENTATION_URL ?? 'https://betagouv.github.io/france-chaleur-urbaine-publicodes',
  summaryAreaSizeLimit: 5, // km²
  tracking: {
    facebookPixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
    googleTagIds: (process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? '').split(',').filter(Boolean),
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
    hotjarSv: process.env.NEXT_PUBLIC_HOTJAR_SV,
    linkInPartnerId: process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID,
    matomoServerURL: process.env.NEXT_PUBLIC_MATOMO_URL,
    matomoSiteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
  },
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://france-chaleur-urbaine.beta.gouv.fr',
};
