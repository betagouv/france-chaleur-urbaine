import type { EventType } from '@/modules/events/constants';

/** Label of the catch-all group that receives any event not matched by a specific group. */
export const catchAllEventGroupLabel = 'Système';

/**
 * Ordered matchers for the specific event groups shown in the documentation.
 * Anything not matched here falls into the catch-all "Système" group — the
 * doc-coverage test asserts that only the explicitly-expected system events do,
 * so a new event type can never land there silently.
 */
export const specificEventGroups: { label: string; match: (type: EventType) => boolean }[] = [
  { label: 'Comptes utilisateurs', match: (type) => type.startsWith('user_') && !type.startsWith('user_permissions') },
  { label: 'Permissions', match: (type) => type.startsWith('user_permissions') },
  { label: 'Demandes', match: (type) => type.startsWith('demand_') },
  { label: 'API partenaire', match: (type) => type.startsWith('api_') },
  { label: "Tests d'adresses", match: (type) => type.startsWith('pro_eligibility_test') },
  { label: 'Réseaux et périmètres', match: (type) => type.startsWith('network_') || type === 'pdp_updated' },
  { label: 'Organisations', match: (type) => type.startsWith('organization_') },
  { label: 'Intégrations iframe', match: (type) => type.startsWith('conversion_source') },
];
