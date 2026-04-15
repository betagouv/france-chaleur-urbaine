import type { NetworkType } from '@/modules/reseaux/constants';

export const eventTypes = [
  'user_login',
  'user_activated',
  'user_created',
  'user_updated',
  'user_deleted',
  'user_password_reset_requested',
  'demand_created',
  'demand_assigned',
  'demand_updated',
  'demand_deleted',
  'demand_email_sent',
  'demand_linked_to_user',
  'demand_network_changed',
  'demand_network_change_requested',
  'demand_relance_sent',
  'demand_validated',
  'demand_unvalidated',
  'pro_eligibility_test_created',
  'pro_eligibility_test_renamed',
  'pro_eligibility_test_updated',
  'pro_eligibility_test_deleted',
  'build_tiles',
  'sync_metadata_from_airtable',
  'sync_geometries_to_airtable',
  'tag_reminder_created',
  'tag_reminder_deleted',
  'tag_comment_updated',
  'network_reminder_created',
] as const;

export type EventType = (typeof eventTypes)[number];

export const eventTypeLabels: Record<EventType, string> = {
  build_tiles: 'Reconstruction tuiles',
  demand_assigned: 'Assignation demande',
  demand_created: 'Création demande',
  demand_deleted: 'Suppression demande',
  demand_email_sent: 'Email envoyé (demande)',
  demand_linked_to_user: 'Liaison demandes → compte',
  demand_network_change_requested: 'Demande de changement de réseau',
  demand_network_changed: 'Changement de réseau (demande)',
  demand_relance_sent: 'Relance automatique',
  demand_unvalidated: 'Dé-validation demande',
  demand_updated: 'Mise à jour demande',
  demand_validated: 'Validation demande',
  network_reminder_created: 'Création relance réseau',
  pro_eligibility_test_created: 'Création test éligibilité',
  pro_eligibility_test_deleted: 'Suppression test éligibilité',
  pro_eligibility_test_renamed: 'Renommage test éligibilité',
  pro_eligibility_test_updated: 'Mise à jour test éligibilité',
  sync_geometries_to_airtable: 'Sync géométries Airtable',
  sync_metadata_from_airtable: 'Sync métadonnées Airtable',
  tag_comment_updated: 'Mise à jour commentaire tag',
  tag_reminder_created: 'Création rappel tag',
  tag_reminder_deleted: 'Suppression rappel tag',
  user_activated: 'Activation utilisateur',
  user_created: 'Création utilisateur',
  user_deleted: 'Suppression utilisateur',
  user_login: 'Connexion utilisateur',
  user_password_reset_requested: 'Demande réinitialisation mot de passe',
  user_updated: 'Mise à jour utilisateur',
};

export type EventDataMap = {
  build_tiles: { name: string };
  demand_assigned: Record<string, unknown> | null;
  demand_created: Record<string, unknown> | null;
  demand_deleted: Record<string, unknown> | null;
  demand_email_sent: { key: string; object: string; to: string };
  demand_linked_to_user: { count: number; email: string };
  demand_network_changed: { network_id: number | null; network_type: NetworkType | null; sncu_id: string | null };
  demand_network_change_requested: { current_network_id: number | null; reason: string; requested_sncu_id: string };
  demand_relance_sent: { isSecondRelance: boolean };
  demand_updated: Record<string, unknown> | null;
  demand_validated: { validated: true };
  demand_unvalidated: { validated: false };
  pro_eligibility_test_created: Record<string, unknown> | null;
  pro_eligibility_test_deleted: Record<string, unknown> | null;
  pro_eligibility_test_renamed: Record<string, unknown> | null;
  pro_eligibility_test_updated: Record<string, unknown> | null;
  sync_geometries_to_airtable: { name: string };
  sync_metadata_from_airtable: { name: string };
  tag_comment_updated: { comment: string; tag_name: string };
  tag_reminder_created: { tag_name: string };
  tag_reminder_deleted: { tag_name: string };
  network_reminder_created: { network_id: number; network_type: NetworkType; note: string | null };
  user_activated: null;
  user_created: null;
  user_deleted: null;
  user_login: null;
  user_password_reset_requested: null;
  user_updated: null;
};

export const eventGranularities = ['minute', 'hour', 'day', 'week', 'month', 'year'] as const;
export type EventGranularity = (typeof eventGranularities)[number];

export const eventPeriodPresets = ['1h', 'today', '1w', '2w', '1m', '2m', '3m', '6m', '1y', 'custom'] as const;
export type EventPeriodPreset = (typeof eventPeriodPresets)[number];
