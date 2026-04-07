import type { UserRole } from '@/types/enum/UserRole';

export const eventTypes = [
  'user_login',
  'user_activated',
  'user_registered',
  'user_created',
  'user_updated',
  'user_newsletter_subscribed',
  'user_newsletter_unsubscribed',
  'user_deleted',
  'user_password_reset_requested',
  'demand_created',
  'demand_assigned',
  'demand_updated',
  'demand_deleted',
  'demand_email_sent',
  'demand_linked_to_user',
  'demand_relance_sent',
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
] as const;

export type EventType = (typeof eventTypes)[number];

export const eventTypeLabels: Record<EventType, string> = {
  build_tiles: 'Reconstruction tuiles',
  demand_assigned: 'Assignation demande',
  demand_created: 'Création demande',
  demand_deleted: 'Suppression demande',
  demand_email_sent: 'Email envoyé (demande)',
  demand_linked_to_user: 'Liaison demandes → compte',
  demand_relance_sent: 'Relance automatique',
  demand_updated: 'Mise à jour demande',
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
  user_created: 'Création utilisateur (admin)',
  user_deleted: 'Suppression utilisateur',
  user_login: 'Connexion utilisateur',
  user_newsletter_subscribed: 'Abonnement newsletter',
  user_newsletter_unsubscribed: 'Désabonnement newsletter',
  user_password_reset_requested: 'Demande réinitialisation mot de passe',
  user_registered: 'Inscription utilisateur',
  user_updated: 'Mise à jour profil utilisateur',
};

export type EventDataMap = {
  build_tiles: { name: string };
  demand_assigned: Record<string, unknown> | null;
  demand_created: Record<string, unknown> | null;
  demand_deleted: Record<string, unknown> | null;
  demand_email_sent: { key: string; object: string; to: string };
  demand_linked_to_user: { count: number; email: string };
  demand_relance_sent: { isSecondRelance: boolean };
  demand_updated: Record<string, unknown> | null;
  pro_eligibility_test_created: Record<string, unknown> | null;
  pro_eligibility_test_deleted: Record<string, unknown> | null;
  pro_eligibility_test_renamed: Record<string, unknown> | null;
  pro_eligibility_test_updated: Record<string, unknown> | null;
  sync_geometries_to_airtable: { name: string };
  sync_metadata_from_airtable: { name: string };
  tag_comment_updated: { comment: string; tag_name: string };
  tag_reminder_created: { tag_name: string };
  tag_reminder_deleted: { tag_name: string };
  user_activated: null;
  user_created: { email: string; role: UserRole };
  user_registered: null;
  user_deleted: null;
  user_login: null;
  user_password_reset_requested: null;
  user_newsletter_subscribed: null;
  user_newsletter_unsubscribed: null;
  user_updated: null;
};

export const eventGranularities = ['minute', 'hour', 'day', 'week', 'month', 'year'] as const;
export type EventGranularity = (typeof eventGranularities)[number];

export const eventPeriodPresets = ['1h', 'today', '1w', '2w', '1m', '2m', '3m', '6m', '1y', 'custom'] as const;
export type EventPeriodPreset = (typeof eventPeriodPresets)[number];
