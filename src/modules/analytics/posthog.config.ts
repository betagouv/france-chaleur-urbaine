import type { ModeDeChauffage, TypeDeChauffage } from '@/modules/demands/constants';
import type { TypeCommune } from '@/server/services/communeAPotentiel';

/**
 * Configuration des événements PostHog.
 *
 * Conventions de nommage :
 * - Événements : category:object_action (verbes au présent)
 * - Propriétés : object_adjective, is_/has_ pour booléens, _date pour dates
 *
 * @see TRACKING_PLAN.md pour la taxonomie complète
 * @see https://posthog.com/docs/product-analytics/best-practices
 */
export type PostHogEventMap = {
  // Éligibilité (funnel principal)
  'eligibility:address_form_submit': {
    address: string;
    source: EligibilityContext;
    is_eligible: boolean;
  };
  'eligibility:contact_form_submit': {
    address: string;
    source: EligibilityContext;
    is_eligible: boolean;
    heating_energy: ModeDeChauffage;
    heating_type?: TypeDeChauffage;
    structure_type: string;
    company_type?: string;
    nb_logements?: number;
    demand_area_m2?: number;
  };

  // Potentiel création réseau
  'potentiel-creation-reseau:commune_form_submit': {
    commune: string;
    potentiel: TypeCommune;
  };
  'potentiel-creation-reseau:contact_form_submit': {
    commune: string;
    email: string;
    potentiel: TypeCommune;
  };

  // Carte
  'map:layer_toggle': {
    layer_name: string;
    is_enabled: boolean;
  };
  'map:legend_toggle': {
    is_open: boolean;
  };
  'map:tab_select': {
    tab_name: 'reseaux' | 'potentiel' | 'enrr' | 'outils';
  };
  'map:tool_use': {
    tool_name: 'distance' | 'density' | 'extraction';
    action: 'start' | 'complete' | 'reset' | 'export';
  };
  'map:feature_click': {
    feature_type: string;
    feature_id?: string;
  };

  // Comparateur
  'comparator:config_create': never;
  'comparator:config_load': {
    is_shared: boolean;
  };
  'comparator:config_share': never;

  // Navigation (liens, CTA, boutons)
  'link:click': {
    link_name: string;
    source: string;
  };

  // Contenu (documents, vidéos, guides)
  'content:click': {
    content_type: 'document' | 'video' | 'guide' | 'faq' | 'external_link';
    content_name: string;
    source: string;
    content_category?: string;
  };
};

export type PostHogEvent = keyof PostHogEventMap;

/**
 * Tuple typé [eventName, properties] pour passer un event PostHog dans les structures de données.
 * `E extends unknown` force la distribution sur l'union.
 */
export type PostHogEventEntry<E extends PostHogEvent = PostHogEvent> = E extends unknown
  ? [PostHogEventMap[E]] extends [never]
    ? [E]
    : [E, PostHogEventMap[E]]
  : never;

export type EligibilityContext = 'carte' | 'comparateur' | 'fiche-reseau' | 'homepage' | 'choix-chauffage';
