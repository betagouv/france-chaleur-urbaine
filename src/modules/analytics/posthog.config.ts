import type { RuleName } from '@betagouv/france-chaleur-urbaine-publicodes';

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
    source?: EligibilityContext;
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
    has_phone?: boolean;
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
  'bulk_test:contact_request_clicked': {
    bulk_test_id: string;
    selected_rows_count: number;
  };
  'bulk_test:contact_request_submitted': {
    bulk_test_id: string;
    selected_rows_count: number;
    has_phone: boolean;
    professional_type?: string | null;
  };
  'bulk_test:session_resumed': {
    bulk_test_id: string;
    days_since_creation: number;
    is_original_creator: boolean;
  };
  'bulk_test:results_filtered': {
    bulk_test_id: string;
    filter_type: string;
  };
  'bulk_test:result_displayed': {
    bulk_test_id: string;
    rows_eligible: number;
    rows_error: number;
    rows_near_network: number;
    rows_non_eligible: number;
    rows_total: number;
  };

  'fcr_simulator:started': {
    address?: string;
    typeLogement?: string;
    espaceExterieur?: string;
    source: 'landing' | 'result';
  };
  'simu_multiENR:params_updated': {
    dpe?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
    surface?: number;
    nb_logements?: number;
    nb_habitants?: number;
  };
  'fcr_simulator:accordion_opened': {
    chauffage_mode: string;
  };
  'simu_multiENR:methodo_clicked': {
    chauffage_mode: string;
  };
  'fcr_simulator:contact_form_submitted': never;

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

  'map:address_searched': never;
  'map:download_network': never;
  // Carte
  'map:layer_toggled': {
    layer: string;
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
    network_name: string;
    network_id?: string;
    enr_rate: number;
  };
  'map:network_exported': {
    network_name: string;
    network_id: number;
  };
  'map:network_clicked': {
    network_id: string;
  };
  'map:manager_contact_form_submitted': never;
  'map:contribute_clicked': never;
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

  // Comparateur CO²
  'comparator:started': { address?: string; distance_reseau_m: number; is_eligible: boolean };
  'comparator:advanced_mode_clicked': { address?: string };
  'comparator:step_1_completed': { address?: string };
  'comparator:step_2_completed': { address?: string; modeChauffage?: string | null };
  'comparator:image_saved': Partial<Record<RuleName, number | string>>;
  'comparator:data_exported': never;
  'comparator:cost_detail_tab_opened': Partial<Record<RuleName, number | string>>;
  'comparator:cost_detail_posts_opened': Partial<Record<RuleName, number | string>>;
  'comparator:co2_emissions_tab_opened': Partial<Record<RuleName, number | string>>;
  'comparator:config_loaded': never;

  // Home
  'home:tool_tile_clicked': ElementType;
  'home:comparator_tile_clicked': never;
  'home:bulk_test_cta_clicked': never;
  'home:guide_download_clicked': { filename: string };
  'home:fcr_tile_clicked': never;
  'home:article_clicked': ElementType;
  'home:news_clicked': ElementType;
  'home:pedagogic_section_clicked': ElementType;
  'home:partner_logo_clicked': { partner_name: string; target_url: string };
  'home:testimonial_carousel_clicked': { action: string; testimonial_index: number };

  'nav:menu_item_clicked': {
    item: string;
    menu_level: number;
  };

  'nav:external_link_clicked': {
    partner_name: string;
    partner_url: string;
  };

  'account:created': never;
  'global:footer_link_clicked': { link_name: string };
  'global:login_cta_clicked': { is_auth: boolean };
  'contact:form_submitted': { contact_reason: string };
  'network_page:address_test_cta_clicked': { network_id: string };
  'network_list:filter_applied': { filter_name: string; filter_value: string };
  'city_page:network_link_clicked': { city_slug: string; target: string };
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
