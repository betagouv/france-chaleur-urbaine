# Analytics Module

Comprehensive tracking and analytics integration for France Chaleur Urbaine.

## Structure

```
analytics/
├── AGENTS.md              # This file
├── TRACKING_PLAN.md       # Plan de tracking PostHog (référence)
├── analytics.config.ts    # Event configuration and tracking mappings
├── client.ts              # Client-side analytics hooks and utilities
└── types.ts               # Type definitions
```

## Supported Platforms

- **PostHog** - Product analytics (nouvelle plateforme principale). Voir [TRACKING_PLAN.md](./TRACKING_PLAN.md) pour le plan de tracking complet, les conventions de nommage, le consentement et l'identification.
- **Matomo** - Analytics historique (en cours de remplacement par PostHog, migration progressive). Ne pas ajouter de nouveaux events Matomo : utiliser PostHog.
- **Google Analytics 4** - Conversion tracking
- **LinkedIn Ads** - Professional network advertising
- **Hotjar** - User behavior recording

## Migration Matomo → PostHog

La migration est progressive :
1. **Nouveaux events** : toujours utiliser PostHog (voir TRACKING_PLAN.md)
2. **Events existants** : migrer au fur et à mesure vers PostHog, puis supprimer le tracking Matomo correspondant
3. **Objectif** : supprimer l'intégration Matomo une fois tous les events migrés

## Configuration

### PostHog (nouvelle plateforme)

Les events PostHog suivent la taxonomie définie dans [TRACKING_PLAN.md](./TRACKING_PLAN.md) :
- Nommage : `categorie:objet_action` en snake_case
- Peu d'events, beaucoup de propriétés filtrables
- Consentement cookie requis (opt-in DSFR)

### Matomo (legacy)

Les events Matomo historiques sont configurés dans `analytics.config.ts` :

```typescript
export const trackingEvents = {
  'Carto|Réseaux chaleur|Active': {
    matomo: ['Carto', 'Réseaux chaleur', 'Active'],
  },
  'Eligibilité|Formulaire de test - Envoi': {
    matomo: ['Eligibilité', 'Formulaire de test - Envoi'],
    google: 'XNYRCJ6h6c0ZELGIqf89',
    linkedin: 5492674,
  },
} as const;
```

## Client API

### `useAnalytics()`

Initialize analytics services. Call once in `_app.tsx`.

```typescript
import { useAnalytics } from '@/modules/analytics/client';

function App() {
  useAnalytics(); // Initialize all analytics platforms
  return <Component {...pageProps} />;
}
```

### `trackEvent(eventKey, ...payload)`

Track custom events across all configured platforms (Matomo, Google, LinkedIn).

```typescript
import { trackEvent } from '@/modules/analytics/client';

// Simple event
trackEvent('Carto|Réseaux chaleur|Active');

// Event with additional data
trackEvent('Eligibilité|Formulaire de test - Envoi', { userId: 123 });
```

### PostHog tracking

PostHog events are sent directly via `posthog.capture()`. See [TRACKING_PLAN.md](./TRACKING_PLAN.md) for the full event taxonomy and implementation details.

### `useMatomoAbTestingExperiment(experimentName)`

A/B testing integration with Matomo (legacy).

```typescript
import { useMatomoAbTestingExperiment } from '@/modules/analytics/client';

function MyComponent() {
  const { ready, variation } = useMatomoAbTestingExperiment('ExperimentName');

  if (!ready) return null;

  return (
    <Button>
      {variation === 'NewLabel' ? 'New Label' : 'Original Label'}
    </Button>
  );
}
```

## Event Categories

### Map Interactions
- Layer activation/deactivation
- Tool usage (measurements, data extraction)
- Tab navigation

### Form Submissions
- Eligibility tests
- Contact forms
- Registration flows

### Content Downloads
- PDF guides
- Data exports
- Media files

### Navigation
- Page views (automatic)
- Tool access
- External links

## Privacy & GDPR

- **PostHog** : tracking conditionné au consentement cookie (opt-in). Voir [TRACKING_PLAN.md](./TRACKING_PLAN.md#consentement-persistance-et-identification) pour les détails
- **Matomo**: Configured without cookies (`disableCookies: true`)
- **Consent**: No explicit consent required for anonymized analytics (Matomo), opt-in required for PostHog
- **Data retention**: Follows CNIL recommendations
- **User rights**: Anonymized data for Matomo, pseudonymized for PostHog (with consent)

## Environment Variables

Required environment variables for tracking:

```bash
# PostHog (required)
NEXT_PUBLIC_POSTHOG_API_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Matomo (legacy, required during migration)
NEXT_PUBLIC_MATOMO_URL=https://matomo.exemple.fr
NEXT_PUBLIC_MATOMO_SITE_ID=1

# Google Analytics (optional)
NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID=GTM-XXXXXX
NEXT_PUBLIC_GOOGLE_TAG_ID=G-XXXXXXXXXX

# LinkedIn Ads (optional)
NEXT_PUBLIC_LINKEDIN_PARTNER_ID=123456

# Hotjar (optional)
NEXT_PUBLIC_HOTJAR_ID=123456
```

## Development Mode

Analytics are logged to console in development:

```typescript
if (isDevModeEnabled()) {
  console.log('trackEvent', eventKey, eventPayload, configuration);
}
```

## Event Naming Convention

### PostHog (new)

```
categorie:objet_action
```

Examples:
- `eligibility:address_submit`
- `map:layer_toggle`
- `content:click`

See [TRACKING_PLAN.md](./TRACKING_PLAN.md#conventions-de-nommage) for the full convention.

### Matomo (legacy)

```
Category|Subcategory|Action
```

Examples:
- `Carto|Réseaux chaleur|Active`
- `Eligibilité|Formulaire de test - Envoi`
- `Téléchargement|Guide FCU|Supports`

## Error Handling

Analytics failures are handled gracefully:

- Network errors don't break the application
- Missing configurations log warnings
- Fallbacks to original variations in A/B tests

## Performance

- Scripts load asynchronously and deferred
- No impact on critical rendering path
- Timeout protection (2s) for unresponsive services
- Event debouncing for rapid interactions
