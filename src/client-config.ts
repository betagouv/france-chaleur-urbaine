// Attention, il faut référencer explicitement chaque variable process.env.NEXT_PUBLIC_*

import { envBooleanSchema } from '@/utils/validation';

// exemple: ENABLE_INSCRIPTIONS: envBooleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_INSCRIPTIONS),
export const clientConfig = {
  websiteOrigin: process.env.NEXT_PUBLIC_MAP_ORIGIN,
  contactEmail: 'france.chaleur.urbaine@ademe.fr', // changer également dans openapi-schema.yaml
  linkedInUrl: 'https://www.linkedin.com/company/france-chaleur-urbaine?originalSubdomain=fr',
  calendarLink: 'https://cal.com/erwangravez/15min',
  tracking: {
    matomoServerURL: process.env.NEXT_PUBLIC_MATOMO_URL,
    matomoSiteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
    googleTagIds: (process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? '').split(',').filter(Boolean),
    facebookPixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
    linkInPartnerId: process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID,
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
    hotjarSv: process.env.NEXT_PUBLIC_HOTJAR_SV,
  },
  flags: {
    enableComparateurWidget: envBooleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR_WIDGET),
  },
  publicodesDocumentationURL:
    process.env.NEXT_PUBLIC_PUBLICODES_DOCUMENTATION_URL ?? 'https://betagouv.github.io/france-chaleur-urbaine-publicodes/',
  summaryAreaSizeLimit: 5, // km²
  networkInfoFieldMaxCharacters: 700,
  networkSearchMinimumCharactersThreshold: 3,
  emails: {
    contact: 'france.chaleur.urbaine@ademe.fr',
  },
};
