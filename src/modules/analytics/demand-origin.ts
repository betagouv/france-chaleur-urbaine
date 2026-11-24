import type { Acquisition } from './constants';

export const originChannels = {
  admin: 'Création admin',
  advertising: 'Publicité',
  ai: 'Assistant IA',
  api: 'API',
  batch: 'Demande groupée',
  campaign: 'Autre campagne',
  emailing: 'Emailing',
  fcu_email: 'Email FCU',
  integration: 'Intégration partenaire',
  map: 'Carte',
  referral: 'Site référent',
  search: 'Moteur de recherche',
  social: 'Réseaux sociaux',
  transfer: 'Transfert CCRT',
  unknown: 'Direct',
} as const;
export type OriginChannel = keyof typeof originChannels;
export type DemandOrigin = {
  channel: OriginChannel;
  detail: string | null;
  acquisition: Acquisition | null;
};

/** Reads historical provenance only when no structured snapshot was recorded; never rewrites stored data. */
export const getDemandAcquisition = (demand: {
  acquisition: Acquisition | null;
  origin_page: string | null;
  origin_host: string | null;
  origin_source: string | null;
}): Acquisition | null => {
  if (demand.acquisition) return demand.acquisition;
  const formPage = demand.origin_page?.split(/[?#]/)[0].trim().slice(0, 1000);
  const host = demand.origin_host?.split(/[?#]/)[0].trim().slice(0, 1000);
  const integrationId = demand.origin_source?.trim().slice(0, 200);
  if (!formPage && !host && !integrationId) return null;
  return {
    campaign: null,
    medium: null,
    source: null,
    ...(formPage ? { formPage } : {}),
    ...(host ? { host } : {}),
    ...(integrationId ? { integrationId } : {}),
  };
};

export const demandOriginFields = [
  ['landingPage', 'Page d’arrivée'],
  ['formPage', 'Page du formulaire'],
  ['referrer', 'Domaine référent'],
  ['integrationId', 'Intégration'],
  ['host', 'Site hôte'],
  ['source', 'Source de campagne'],
  ['medium', 'Support de campagne'],
  ['campaign', 'Campagne'],
  ['keyword', 'Mot-clé'],
  ['creationMethod', 'Mode de création'],
] as const satisfies ReadonlyArray<readonly [keyof Acquisition, string]>;

/** Uses the same evidence labels and creation-method values in popovers and exports. */
export const getDemandOriginValue = (acquisition: Acquisition | null | undefined, key: (typeof demandOriginFields)[number][0]): string =>
  key === 'creationMethod' ? (acquisition?.creationMethod ? originChannels[acquisition.creationMethod] : '') : (acquisition?.[key] ?? '');

/** Classifies the recorded acquisition snapshot with the same rules for both demand types. */
export const classifyDemandOrigin = (acquisition: Acquisition | null, integrationLabels: Record<string, string> = {}): DemandOrigin => {
  const result = (channel: OriginChannel, detail: string | null = null): DemandOrigin => ({ acquisition, channel, detail });
  if (!acquisition) {
    return result('unknown');
  }
  if (acquisition.creationMethod) {
    return result(acquisition.creationMethod);
  }
  if (acquisition.integrationId || acquisition.inIframe || acquisition.host) {
    return result(
      'integration',
      acquisition.integrationId
        ? Object.hasOwn(integrationLabels, acquisition.integrationId)
          ? integrationLabels[acquisition.integrationId]
          : (acquisition.host ?? acquisition.integrationId)
        : (acquisition.host ?? acquisition.landingPage ?? null)
    );
  }
  const source = acquisition.source?.toLowerCase().trim() ?? '';
  const medium = acquisition.medium?.toLowerCase().trim() ?? '';
  const detail = acquisition.campaign || acquisition.source || null;
  if (acquisition.fcuEmail || (source === 'fcu' && /email|mail/.test(medium))) {
    return result('fcu_email', detail);
  }
  if (/^(cpc|ppc|paidsearch|paid_search|paid_social|display|cpm|ads)$/.test(medium)) {
    return result('advertising', source === 'google' ? ['Google Ads', acquisition.campaign].filter(Boolean).join(' · ') : detail);
  }
  if (/^(email|e-mail|emailing|newsletter)$/.test(medium) || /^(brevo|newsletter|emailing)$/.test(source)) {
    return result('emailing', detail);
  }
  const sourceChannel = classifyDomain(source);
  if (sourceChannel) {
    return result(sourceChannel, detail);
  }
  if (acquisition.source || acquisition.medium || acquisition.campaign || acquisition.keyword) {
    return result('campaign', detail);
  }
  if (acquisition.referrer) {
    return result(classifyDomain(acquisition.referrer) ?? 'referral', acquisition.referrer);
  }
  const isMapPage = [acquisition.formPage, acquisition.landingPage].some((page) => page?.split(/[?#]/)[0].replace(/\/$/, '') === '/carte');
  return result(isMapPage ? 'map' : 'unknown', acquisition.formPage ?? acquisition.landingPage ?? null);
};

/** Matches whole domain boundaries so unrelated sites cannot impersonate a known channel. */
const classifyDomain = (value: string): OriginChannel | undefined => {
  const domain = value
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0];
  if (
    /^(chatgpt|perplexity|claude|gemini|copilot)$/.test(domain) ||
    /^(.*\.)?(chatgpt\.com|chat\.openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com)$/.test(domain)
  ) {
    return 'ai';
  }
  if (
    /^(google|bing|yahoo|duckduckgo|ecosia|qwant)$/.test(domain) ||
    /^(.*\.)?(google\.(com|fr)|bing\.com|search\.yahoo\.com|duckduckgo\.com|ecosia\.org|qwant\.com)$/.test(domain)
  ) {
    return 'search';
  }
  if (
    /^(facebook|instagram|linkedin|twitter|pinterest|tiktok)$/.test(domain) ||
    /^(.*\.)?(facebook\.com|instagram\.com|linkedin\.com|twitter\.com|x\.com|t\.co|pinterest\.com|tiktok\.com)$/.test(domain)
  ) {
    return 'social';
  }
  return undefined;
};
