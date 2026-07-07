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
