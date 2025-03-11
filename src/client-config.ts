import { z } from 'zod';

const booleanSchema = z
  .enum(['0', '1', 'true', 'false'])
  .catch('false')
  .transform((value) => value == 'true' || value == '1');

// Attention, il faut référencer explicitement chaque variable process.env.NEXT_PUBLIC_*
export const clientConfig = {
  websiteOrigin: process.env.NEXT_PUBLIC_MAP_ORIGIN,
  tracking: {
    matomoServerURL: process.env.NEXT_PUBLIC_MATOMO_URL,
    matomoSiteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
    googleTagIds: (process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? '').split(',').filter(Boolean),
    facebookPixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
    linkInPartnerId: process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID,
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
    hotjarSv: process.env.NEXT_PUBLIC_HOTJAR_SV,
  },
  publicodesDocumentationURL:
    process.env.NEXT_PUBLIC_PUBLICODES_DOCUMENTATION_URL ?? 'https://betagouv.github.io/france-chaleur-urbaine-publicodes/',
  summaryAreaSizeLimit: 5, // km²
  networkInfoFieldMaxCharacters: 700,
  networkSearchMinimumCharactersThreshold: 3,
  ENABLE_COMPARATEUR_WIDGET: booleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR_WIDGET),
  ENABLE_COMPARATEUR: booleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR),
  ENABLE_TEST_ADRESSES: booleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_TEST_ADRESSES),
  ENABLE_INSCRIPTIONS: booleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_INSCRIPTIONS),
};
