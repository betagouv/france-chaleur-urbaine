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
  'address_test:started': {
    chauffage_type?: 'collectif' | 'individuel';
    source: EligibilityContext;
  };
  'address_test:submitted': {
    address: string;
    source: EligibilityContext;
    is_eligible: boolean;
    chauffage_type?: 'collectif' | 'individuel';
    distance_reseau_m?: number;
  };
  'address_test:result_displayed': {
    source: EligibilityContext;
    result_type: 'en construction' | 'pdp' | 'eligible' | 'non eligible';
    chauffage_type?: 'collectif' | 'individuel';
    distance_reseau_m?: number;
  };
  'address_test:discover_more_clicked': {
    source: EligibilityContext;
    result_type: 'en construction' | 'pdp' | 'eligible' | 'non eligible';
    chauffage_type?: 'collectif' | 'individuel';
    distance_reseau_m?: number;
  };
  'address_test:contact_form_submitted': {
    address: string;
    source: EligibilityContext;
    is_eligible: boolean;
    heating_energy: ModeDeChauffage;
    heating_type?: TypeDeChauffage;
    structure_type: string;
    company_type?: string;
    nb_logements?: number;
    demand_area_m2?: number;
    has_phone: boolean;
  };

  // Test d'adresse en masse
  'bulk_test:results_exported': {
    bulk_test_id: string;
    rows_exported: number;
    filter_applied: boolean;
  };
  'bulk_test:processing_started': {
    bulk_test_id: string;
    rows_count?: number;
  };
  'bulk_test:map_viewed': {
    bulk_test_id: string;
    rows_displayed_on_map?: number;
  };
  'bulk_test:file_uploaded': {
    rows_count: number;
    file_size_kb: number;
  };
  'bulk_test:contact_request_submitted': {
    bulk_test_id: string;
    selected_rows_count: number;
    has_phone: boolean;
    professional_type?: string | null;
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

  // Simulateur simplifié: Chaleur renouvelable
  'chaleur-renouvelable:address_select': {
    address: string;
    source: 'landing' | 'result';
  };
  'chaleur-renouvelable:form_submit': {
    address: string;
    typeLogement: string;
    espaceExterieur: string;
  };
  'chaleur-renouvelable:accordeon': {
    name: string;
  };

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

  // Home
  'home:tool_tile_clicked': ElementType;
  'home:comparator_tile_clicked': never;
  'home:bulk_test_cta_clicked': never;
  'home:guide_download_clicked': never;
  'home:fcr_tile_clicked': never;
  'home:article_clicked': ElementType;
  'home:news_clicked': ElementType;
  'home:pedagogic_section_clicked': ElementType;
  'home:partner_logo_clicked': { partner_name: string; target_url: string };
  'home:testimonial_carousel_clicked': { action: string; testimonial_index: number };
};
type ElementType = {
  element_name: string;
};
export type PostHogEvent = keyof PostHogEventMap;

export type PostHogTrackingProps<Event extends PostHogEvent = PostHogEvent> = {
  postHogEventKey?: Event;
} & ([PostHogEventMap[Event]] extends [never] ? { postHogEventProps?: never } : { postHogEventProps?: PostHogEventMap[Event] });

/**
 * Tuple typé [eventName, properties] pour passer un event PostHog dans les structures de données.
 * `E extends unknown` force la distribution sur l'union.
 */
export type PostHogEventEntry<E extends PostHogEvent = PostHogEvent> = E extends unknown
  ? [PostHogEventMap[E]] extends [never]
    ? [E]
    : [E, PostHogEventMap[E]]
  : never;

export type EligibilityContext =
  | 'carte'
  | 'comparateur'
  | 'fiche-reseau'
  | 'homepage'
  | 'choix-chauffage'
  | 'chaleur-renouvelable'
  | 'eligibility';
