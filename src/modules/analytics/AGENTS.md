# Analytics Module

Comprehensive tracking and analytics integration for France Chaleur Urbaine.

## Structure

```
analytics/
├── AGENTS.md              # This file
├── analytics.config.ts    # Event configuration and tracking mappings
├── client.ts              # Client-side analytics hooks and utilities
└── types.ts               # Type definitions
```

## Supported Platforms

- **Matomo** - Main analytics platform (privacy-friendly)
- **Google Analytics 4** - Conversion tracking
- **LinkedIn Ads** - Professional network advertising
- **Hotjar** - User behavior recording

## Configuration

All tracking events are centrally configured in `analytics.config.ts`:

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

Track custom events across all configured platforms.

```typescript
import { trackEvent } from '@/modules/analytics/client';

// Simple event
trackEvent('Carto|Réseaux chaleur|Active');

// Event with additional data
trackEvent('Eligibilité|Formulaire de test - Envoi', { userId: 123 });
```

### `useMatomoAbTestingExperiment(experimentName)`

A/B testing integration with Matomo.

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

- **Matomo**: Configured without cookies (`disableCookies: true`)
- **Consent**: No explicit consent required for anonymized analytics
- **Data retention**: Follows CNIL recommendations
- **User rights**: Anonymized data, no personal identification

## Environment Variables

Required environment variables for tracking:

```bash
# Matomo (required)
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

Events follow a hierarchical naming pattern:

```
Category|Subcategory|Action
```

Examples:
- `Carto|Réseaux chaleur|Active`
- `Eligibilité|Formulaire de test - Envoi`
- `Téléchargement|Guide FCU|Supports`

## Integration Examples

### Map Layer Tracking

```typescript
const handleLayerToggle = (layerName: string, active: boolean) => {
  const action = active ? 'Active' : 'Désactive';
  trackEvent(`Carto|${layerName}|${action}` as TrackingEvent);
};
```

### Form Submission Tracking

```typescript
const handleFormSubmit = async (formData: FormData) => {
  const isEligible = await checkEligibility(formData.address);
  const status = isEligible ? 'éligible' : 'inéligible';
  trackEvent(`Eligibilité|Formulaire de contact ${status} - Envoi`);
};
```

### Download Tracking

```typescript
const handleDownload = (filename: string, category: string) => {
  trackEvent(`Téléchargement|${filename}|${category}`);
};
```

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