import { describe, expect, it } from 'vitest';

import type { Acquisition } from './constants';
import { classifyDemandOrigin, type OriginChannel } from './demand-origin';

const campaign = { campaign: null, medium: null, source: null };

describe('demand origin rules', () => {
  const cases: [string, Partial<Acquisition> | null, OriginChannel, string | null][] = [
    ['no evidence', null, 'unknown', null],
    ['admin takes precedence', { creationMethod: 'admin', integrationId: 'partner', medium: 'cpc', source: 'google' }, 'admin', null],
    ['API creation', { creationMethod: 'api' }, 'api', null],
    ['grouped creation', { creationMethod: 'batch' }, 'batch', null],
    ['transfer', { creationMethod: 'transfer' }, 'transfer', null],
    ['integration precedes campaign', { integrationId: 'partner', medium: 'cpc', source: 'google' }, 'integration', 'Hellio'],
    ['integration matching an object property', { integrationId: 'toString' }, 'integration', 'toString'],
    ['archived unknown integration', { integrationId: 'old' }, 'integration', 'old'],
    ['iframe', { host: 'example.com/iframe', inIframe: true }, 'integration', 'example.com/iframe'],
    ['paid Google', { campaign: 'automne', medium: 'cpc', source: 'google' }, 'advertising', 'Google Ads · automne'],
    ['emailing', { campaign: 'emailing_oct26', medium: 'email', source: 'brevo' }, 'emailing', 'emailing_oct26'],
    ['FCU email', { campaign: 'raccordement-non-realisable', medium: 'email', source: 'fcu' }, 'fcu_email', 'raccordement-non-realisable'],
    ['FCU refusal link', { fcuEmail: true }, 'fcu_email', null],
    ['other campaign precedes referrer', { referrer: 'google.com', source: 'rdc' }, 'campaign', 'rdc'],
    ['AI UTM', { source: 'chatgpt.com' }, 'ai', 'chatgpt.com'],
    ['AI referrer', { referrer: 'www.perplexity.ai' }, 'ai', 'www.perplexity.ai'],
    ['search', { referrer: 'www.google.fr' }, 'search', 'www.google.fr'],
    ['social', { referrer: 'l.facebook.com' }, 'social', 'l.facebook.com'],
    ['external site', { referrer: 'france-renov.gouv.fr' }, 'referral', 'france-renov.gouv.fr'],
    ['domain lookalike', { referrer: 'chatgpt.com.example.org' }, 'referral', 'chatgpt.com.example.org'],
    ['missing referrer', { landingPage: '/carte' }, 'unknown', null],
  ];
  it.each(cases)('%s', (_, values, channel, detail) => {
    const acquisition = values ? { ...campaign, ...values } : null;
    expect(classifyDemandOrigin(acquisition, { partner: 'Hellio' })).toStrictEqual({ acquisition, channel, detail });
  });
});
