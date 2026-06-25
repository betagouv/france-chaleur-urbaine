/**
 * Source d'intégration (niveau 1), lue **à l'instant de l'appel** dans le `?source=` de l'URL.
 * Aucune persistance (choix d'attribution stricte) : la source ne vit que sur la page d'atterrissage —
 * dans une iframe l'URL la porte en permanence, et `/iframe/form` la propage dans l'URL de redirection.
 * Dès qu'on navigue, les events retombent sur la route de la surface (niveau 1 = `source ?? route`).
 */
export function getConversionSource(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return new URLSearchParams(window.location.search).get('source')?.trim() || null;
}

/**
 * Normalise une URL hôte vers la valeur la plus précise *utile* : `domaine + pathname` (sans protocole ni
 * query/hash — drill stable, pas de query strings partenaires stockées). Souvent réduite au domaine en
 * amont par le `Referrer-Policy` du site partenaire. Une valeur déjà normalisée (relue depuis le `?host=`
 * propagé par `/iframe/form`) passe par le fallback et ressort telle quelle.
 */
function normalizeHost(raw: string | null | undefined): string | undefined {
  if (!raw) {
    return undefined;
  }
  try {
    const url = new URL(raw);
    return `${url.host}${url.pathname}`;
  } catch {
    return raw.slice(0, 2000);
  }
}

/**
 * Contexte de tracking de conversion côté client.
 * - `inIframe` : la surface est-elle embarquée dans une iframe.
 * - `host` = page embarquante (best-effort, cf. `normalizeHost`) : en iframe via `document.referrer` /
 *   `ancestorOrigins` ; hors iframe via le `?host=` de l'URL (propagé par la redirection de
 *   `/iframe/form`, même règle d'atterrissage que `?source=`).
 */
export function getTrackingContext(): { inIframe: boolean; host: string | undefined } {
  if (typeof window === 'undefined') {
    return { host: undefined, inIframe: false };
  }
  const inIframe = window.self !== window.top;
  const host = normalizeHost(
    inIframe ? document.referrer || window.location.ancestorOrigins?.[0] : new URLSearchParams(window.location.search).get('host')
  );
  return { host, inIframe };
}

/** N'émet pas d'événement de conversion depuis l'admin (ex. preview du générateur d'iframes). */
export const isTrackablePage = () => typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin');

/**
 * Attribution bonus posée sur la demande (`demands.origin_source` / `origin_page` / `origin_host`).
 * `origin_source` n'est renseignée que pour une demande attribuée à une intégration (`?source=`).
 * `origin_host` = page embarquante (cf. `getTrackingContext`) : décisif pour les iframes, où `origin_page`
 * (`/iframe/carte`, ou `/` après redirection) et `origin_source` (souvent absent) n'identifient pas le partenaire.
 * Vide hors page trackable (admin, SSR).
 */
export function getDemandOrigin(): { origin_page?: string; origin_source?: string; origin_host?: string } {
  if (!isTrackablePage()) {
    return {};
  }
  return {
    origin_host: getTrackingContext().host,
    origin_page: window.location.pathname,
    origin_source: getConversionSource() ?? undefined,
  };
}
