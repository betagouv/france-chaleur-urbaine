// Attention, il faut référencer explicitement chaque variable process.env.NEXT_PUBLIC_*

// exemple: ENABLE_INSCRIPTIONS: envBooleanSchema.default(false).parse(process.env.NEXT_PUBLIC_FLAG_ENABLE_INSCRIPTIONS),
export const clientConfig = {
  banApiBaseUrl: process.env.NEXT_PUBLIC_BAN_API_BASE_URL ?? 'https://data.geopf.fr/geocodage/',
  // Adresse de contact de l'équipe FCU (affichée publiquement et destinataire des notifications internes)
  contactEmail: 'france.chaleur.urbaine@ademe.fr',
  linkedInUrl: 'https://fr.linkedin.com/company/france-chaleur-urbaine',
  networkInfoFieldMaxCharacters: 700,
  networkSearchMinimumCharactersThreshold: 3,
  // Adresse d'expédition des emails FCU (source unique, réutilisée par MAIL_FROM côté serveur et l'UI de confirmation)
  noReplyEmail: 'no-reply@france-chaleur-urbaine.beta.gouv.fr',
  publicodesDocumentationURL:
    process.env.NEXT_PUBLIC_PUBLICODES_DOCUMENTATION_URL ?? 'https://betagouv.github.io/france-chaleur-urbaine-publicodes',
  rechercheEntreprisesApiUrl: process.env.NEXT_PUBLIC_RECHERCHE_ENTREPRISES_API_URL ?? 'https://recherche-entreprises.api.gouv.fr',
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
