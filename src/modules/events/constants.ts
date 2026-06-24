import type { NetworkEntityType, NetworkType, ReminderType } from '@/modules/reseaux/constants';
import type { UserRole } from '@/types/enum/UserRole';

export const eventTypes = [
  'user_login',
  'user_activated',
  'user_registered',
  'user_newsletter_subscribed',
  'user_newsletter_unsubscribed',
  'user_password_reset_requested',
  'user_profile_updated',
  'user_created_by_admin',
  'user_created_by_api',
  'user_deactivated_by_api',
  'user_updated_by_admin',
  'user_deleted_by_admin',
  'demand_created',
  'demand_updated',
  'demand_updated_by_system',
  'demand_satisfaction_submitted',
  'demand_satisfaction_comment_submitted',
  'demand_survey_submitted',
  'demand_deleted',
  'demand_email_sent',
  'demand_notification_sent',
  'demand_linked_to_user',
  'demand_assignment_changed',
  'demand_assignment_change_requested',
  'demand_assignment_change_request_cancelled',
  'demand_assignment_change_request_rejected',
  'demand_relance_sent',
  'demand_validated',
  'pro_eligibility_test_created',
  'pro_eligibility_test_renamed',
  'pro_eligibility_test_updated',
  'pro_eligibility_test_deleted',
  'build_tiles',
  'sync_metadata_from_airtable',
  'sync_geometries_to_airtable',
  'network_reminder_created',
  'network_reminder_updated',
  'network_reminder_deleted',
  'user_permissions_updated',
  'user_permissions_synced_from_api',
  'pdp_updated',
  'network_created',
  'network_deleted',
  'network_geometry_updated',
  'network_geometries_applied',
  'network_notes_updated',
  'conversion_source_created',
  'conversion_source_updated',
  'conversion_source_archived',
] as const;

export type EventType = (typeof eventTypes)[number];

export const eventTypeLabels: Record<EventType, string> = {
  build_tiles: 'Reconstruction tuiles',
  conversion_source_archived: "Archivage d'intégration iframe",
  conversion_source_created: "Création d'intégration iframe",
  conversion_source_updated: "Mise à jour d'intégration iframe",
  demand_assignment_change_request_cancelled: 'Annulation de demande de réaffectation',
  demand_assignment_change_request_rejected: 'Rejet de demande de réaffectation',
  demand_assignment_change_requested: 'Demande de réaffectation',
  demand_assignment_changed: 'Réaffectation (demande)',
  demand_created: 'Création demande',
  demand_deleted: 'Suppression demande',
  demand_email_sent: 'Email envoyé (demande)',
  demand_linked_to_user: 'Liaison demandes → compte',
  demand_notification_sent: 'Notification gestionnaires',
  demand_relance_sent: 'Relance automatique',
  demand_satisfaction_comment_submitted: 'Commentaire post-satisfaction',
  demand_satisfaction_submitted: 'Réponse satisfaction',
  demand_survey_submitted: 'Réponse au sondage',
  demand_updated: 'Mise à jour demande',
  demand_updated_by_system: 'Mise à jour demande (automatique)',
  demand_validated: 'Validation demande',
  network_created: 'Création réseau/PDP',
  network_deleted: 'Suppression réseau/PDP',
  network_geometries_applied: 'Application des modifications géométriques',
  network_geometry_updated: 'Mise à jour géométrie réseau',
  network_notes_updated: 'Mise à jour des notes du réseau',
  network_reminder_created: 'Création relance réseau',
  network_reminder_deleted: 'Suppression relance réseau',
  network_reminder_updated: 'Mise à jour relance réseau',
  pdp_updated: 'Mise à jour périmètre de développement',
  pro_eligibility_test_created: 'Création test éligibilité',
  pro_eligibility_test_deleted: 'Suppression test éligibilité',
  pro_eligibility_test_renamed: 'Renommage test éligibilité',
  pro_eligibility_test_updated: 'Mise à jour test éligibilité',
  sync_geometries_to_airtable: 'Sync géométries Airtable',
  sync_metadata_from_airtable: 'Sync métadonnées Airtable',
  user_activated: 'Activation utilisateur',
  user_created_by_admin: 'Création utilisateur (admin)',
  user_created_by_api: 'Création utilisateur (API)',
  user_deactivated_by_api: 'Désactivation utilisateur (API)',
  user_deleted_by_admin: 'Suppression utilisateur (admin)',
  user_login: 'Connexion utilisateur',
  user_newsletter_subscribed: 'Abonnement newsletter',
  user_newsletter_unsubscribed: 'Désabonnement newsletter',
  user_password_reset_requested: 'Demande réinitialisation mot de passe',
  user_permissions_synced_from_api: 'Synchronisation permissions (API)',
  user_permissions_updated: 'Modification permissions',
  user_profile_updated: 'Mise à jour profil',
  user_registered: 'Inscription utilisateur',
  user_updated_by_admin: 'Mise à jour utilisateur (admin)',
};

/**
 * Snapshot d'un réseau utilisé dans les payloads d'events liés au changement de réseau d'une demande.
 * Tous les champs sont nullable pour couvrir le cas "pas de réseau affecté".
 */
export type EventNetworkSnapshot = {
  network_type: NetworkType | null;
  network_id: number | null;
  network_name: string | null;
  network_sncu_id: string | null;
  distance: number | null;
};

export type EventDataMap = {
  build_tiles: { name: string };
  conversion_source_archived: { key: string; label: string };
  conversion_source_created: { key: string; label: string };
  conversion_source_updated: { key: string; label: string };
  demand_created: Record<string, unknown> | null;
  demand_deleted: Record<string, unknown> | null;
  demand_email_sent: { key: string; object: string; to: string };
  demand_linked_to_user: { count: number; email: string };
  demand_notification_sent: null;
  demand_assignment_changed: { old: EventNetworkSnapshot; new: EventNetworkSnapshot };
  demand_assignment_change_requested: { old: EventNetworkSnapshot; new: EventNetworkSnapshot; comment: string | null };
  demand_assignment_change_request_cancelled: { pending: EventNetworkSnapshot; comment: string | null };
  demand_assignment_change_request_rejected: { pending: EventNetworkSnapshot; comment: string | null };
  demand_relance_sent: { isSecondRelance: boolean };
  demand_satisfaction_comment_submitted: { comment: string };
  demand_satisfaction_submitted: { recontacted: boolean };
  demand_survey_submitted: { sondage: string[] };
  demand_updated: Record<string, unknown> | null;
  demand_updated_by_system: Record<string, unknown> | null;
  demand_validated: { relance_a_activer: boolean };
  pro_eligibility_test_created: Record<string, unknown> | null;
  pro_eligibility_test_deleted: Record<string, unknown> | null;
  pro_eligibility_test_renamed: Record<string, unknown> | null;
  pro_eligibility_test_updated: Record<string, unknown> | null;
  sync_geometries_to_airtable: { name: string };
  sync_metadata_from_airtable: { name: string };
  network_created: { id: string; identifiant_reseau: string | null; nom_reseau: string | null; type: string };
  network_deleted: { id: number; identifiant_reseau: string | null; nom_reseau: string | null; type: string };
  network_geometries_applied: {
    name: string;
    processed: { total: number; created: number; updated: number; deleted: number };
    affected_bboxes_count: number;
  };
  network_geometry_updated: { id: number; identifiant_reseau: string | null; nom_reseau: string | null; type: string };
  network_notes_updated: {
    network_id: number;
    network_type: NetworkEntityType;
    nom_reseau: string | null;
    identifiant_reseau: string | null;
    first_commune: string | null;
    communes_count: number;
    notes: string | null;
  };
  pdp_updated: {
    'Identifiant reseau'?: string;
    reseau_de_chaleur_ids?: number[];
    reseau_en_construction_ids?: number[];
  };
  network_reminder_created: {
    reminder_id: string;
    network_id: number;
    network_type: NetworkEntityType;
    type: ReminderType;
    note: string | null;
  };
  network_reminder_updated: {
    reminder_id: string;
    network_id: number;
    network_type: NetworkEntityType;
    type: ReminderType;
    changes: Partial<{ note: string | null; created_at: string }>;
  };
  network_reminder_deleted: {
    reminder_id: string;
    network_id: number;
    network_type: NetworkEntityType;
    type: ReminderType;
    note: string | null;
    created_at: string;
  };
  user_activated: null;
  user_created_by_admin: { user_email: string; role: UserRole };
  user_created_by_api: { user_email: string; role: UserRole; api_name: string };
  user_deactivated_by_api: { api_name: string; user_email: string };
  user_deleted_by_admin: { user_email: string };
  user_registered: null;
  user_login: null;
  user_password_reset_requested: null;
  user_permissions_synced_from_api: {
    api_name: string;
    user_email: string;
    added: Array<{ type: string; resource_id: string | null }>;
  };
  user_permissions_updated: {
    user_email: string;
    added: Array<{ type: string; resource_id: string | null }>;
    removed: Array<{ type: string; resource_id: string | null }>;
  };
  user_profile_updated: { changes: Record<string, unknown> };
  user_updated_by_admin: { user_email: string; changes: Record<string, unknown> };
  user_newsletter_subscribed: null;
  user_newsletter_unsubscribed: null;
};

export const eventGranularities = ['minute', 'hour', 'day', 'week', 'month', 'year'] as const;
export type EventGranularity = (typeof eventGranularities)[number];

export const eventPeriodPresets = ['1h', 'today', '1w', '2w', '1m', '2m', '3m', '6m', '1y', 'custom'] as const;
export type EventPeriodPreset = (typeof eventPeriodPresets)[number];
