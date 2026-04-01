// Attention, il faut référencer explicitement chaque variable process.env.NEXT_PUBLIC_*

// exemple: ENABLE_INSCRIPTIONS: envBooleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_INSCRIPTIONS),
export const clientConfig = {
  banApiBaseUrl: process.env.NEXT_PUBLIC_BAN_API_BASE_URL ?? 'https://data.geopf.fr/geocodage/',
  calendarLink: 'https://cal.com/erwangravez/15min',
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
  feedbackUrl:
    'https://voxusagers.numerique.gouv.fr/Demarches/3067?&view-mode=formulaire-avis&nd_mode=en-ligne-enti%C3%A8rement&nd_source=button&key=d72603000c07b99a66da0a230c832f7e',
  linkedInUrl: 'https://fr.linkedin.com/company/france-chaleur-urbaine',
  networkInfoFieldMaxCharacters: 700,
  networkSearchMinimumCharactersThreshold: 3,
  publicodesDocumentationURL:
    process.env.NEXT_PUBLIC_PUBLICODES_DOCUMENTATION_URL ?? 'https://betagouv.github.io/france-chaleur-urbaine-publicodes',
  summaryAreaSizeLimit: 5, // km²
  tracking: {
    googleTagIds: (process.env.NEXT_PUBLIC_GOOGLE_TAG_ID ?? '').split(',').filter(Boolean),
    hotjarId: process.env.NEXT_PUBLIC_HOTJAR_ID,
    hotjarSv: process.env.NEXT_PUBLIC_HOTJAR_SV,
    linkInPartnerId: process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID,
    matomoServerURL: process.env.NEXT_PUBLIC_MATOMO_URL,
    matomoSiteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID,
    postHogApiHost: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    postHogKey: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  },
  websiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://france-chaleur-urbaine.beta.gouv.fr',
};
