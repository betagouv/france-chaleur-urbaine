export const clientConfig = {
  tracking: {
    matomoServerURL: process.env.NEXT_PUBLIC_MATOMO_URL,
    matomoSiteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
    googleTagId: process.env.NEXT_PUBLIC_GOOGLE_TAG_ID,
    facebookPixelId: process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID,
    linkInPartnerId: process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID,
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
    hotjarSv: process.env.NEXT_PUBLIC_HOTJAR_SV,
  },
  summaryAreaSizeLimit: 5, // km²
  networkInfoFieldMaxCharacters: 700,
  networkSearchMinimumCharactersThreshold: 3,
};
