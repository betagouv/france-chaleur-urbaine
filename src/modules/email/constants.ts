export type EmailTriggerType = 'action' | 'cron';

/** Structured description of what causes an email to be sent, displayed in the admin (emails page + workflow doc). */
export type EmailTrigger = {
  type: EmailTriggerType;
  /** French description of the exact trigger condition, including who performs the action */
  description: string;
};

export const emailTriggerTypeLabels: Record<EmailTriggerType, string> = {
  action: 'Action manuelle',
  cron: 'Automatique (cron)',
};

export const emailTriggerTypeBadgeClasses: Record<EmailTriggerType, string> = {
  action: 'fr-badge--blue-ecume',
  cron: 'fr-badge--purple-glycine',
};

/** Reason codes returned by Brevo for a blocked transactional contact (`GET /v3/smtp/blockedContacts`). */
const emailBlockReasonLabels: Record<string, string> = {
  adminBlocked: 'Bloqué manuellement dans Brevo',
  contactFlaggedAsSpam: 'Signalé comme spam par le destinataire',
  hardBounce: 'Rejet définitif par le serveur destinataire (hard bounce)',
  unsubscribedViaApi: "Désinscription via l'API Brevo",
  unsubscribedViaEmail: 'Désinscription depuis un email (lien « se désabonner »)',
  unsubscribedViaMA: 'Désinscription via une automation marketing Brevo',
};

export const getEmailBlockReasonLabel = (code: string) => emailBlockReasonLabels[code] ?? code;

type EmailEventSeverity = 'success' | 'warning' | 'error' | 'info';

/** Event names returned by Brevo (`GET /v3/smtp/statistics/events`). Unknown names fall back to the raw value. */
const emailEventLabels: Record<string, { label: string; severity: EmailEventSeverity }> = {
  blocked: { label: 'Bloqué (non envoyé)', severity: 'error' },
  clicks: { label: 'Clic', severity: 'info' },
  deferred: { label: 'Différé', severity: 'warning' },
  delivered: { label: 'Délivré', severity: 'success' },
  error: { label: 'Erreur', severity: 'error' },
  hardBounces: { label: 'Rejet définitif (hard bounce)', severity: 'error' },
  invalid: { label: 'Adresse invalide', severity: 'error' },
  loadedByProxy: { label: 'Ouvert (via proxy)', severity: 'info' },
  opened: { label: 'Ouvert', severity: 'info' },
  requests: { label: 'Envoi demandé', severity: 'info' },
  softBounces: { label: 'Rejet temporaire (soft bounce)', severity: 'warning' },
  spam: { label: 'Signalé comme spam', severity: 'error' },
  unsubscribed: { label: 'Désinscription', severity: 'error' },
};

export const getEmailEventLabel = (event: string) => emailEventLabels[event] ?? { label: event, severity: 'info' as const };

const emailUnblockSources = ['admin', 'external'] as const;
export type EmailUnblockSource = (typeof emailUnblockSources)[number];

export const emailUnblockSourceLabels: Record<EmailUnblockSource, string> = {
  admin: 'par un admin',
  external: 'détecté à la synchronisation (déblocage fait hors FCU)',
};
