/** Groups in display order (array order is preserved; biome would re-sort object keys). */
export const adminPageGroups = [
  { id: 'management', label: 'Gestion' },
  { id: 'analytics', label: 'Pilotage' },
  { id: 'tools', label: 'Outils' },
  { id: 'system', label: 'Système' },
] as const;

export type AdminPageGroup = (typeof adminPageGroups)[number]['id'];

/**
 * Single source of truth for the admin pages, feeding the navigation menu
 * (`SimplePage`). Keep entries grouped and ordered by `group`.
 */
export const adminPages = [
  {
    group: 'management',
    href: '/admin/demandes',
    label: 'Gestion des demandes',
  },
  {
    group: 'management',
    href: '/admin/demandes-chaleur-renouvelable',
    label: 'Gestion des demandes chaleur renouvelable',
  },
  {
    group: 'management',
    href: '/admin/modifications-reseau',
    label: 'Demandes de modification de réseau',
  },
  {
    group: 'management',
    href: '/admin/users',
    label: 'Gestion des utilisateurs',
  },
  {
    group: 'management',
    href: '/admin/reseaux',
    label: 'Gestion des réseaux',
  },
  {
    group: 'management',
    href: '/admin/organizations',
    label: 'Gestion des organisations',
  },
  {
    group: 'management',
    href: '/admin/territoires',
    label: 'Territoires personnalisés',
  },
  {
    group: 'analytics',
    href: '/admin/events',
    label: 'Activité du site',
  },
  {
    group: 'analytics',
    href: '/admin/conversion',
    label: 'Conversion par source',
  },
  {
    group: 'analytics',
    href: '/admin/conversion/chaleur-renouvelable',
    label: 'Conversion — simulateur chaleur renouvelable',
  },
  {
    group: 'analytics',
    href: '/admin/conversion/abus',
    label: 'Conversion — contrôle des abus',
  },
  {
    group: 'analytics',
    href: '/admin/reseaux/suivi',
    label: 'Suivi des réseaux',
  },
  {
    group: 'analytics',
    href: '/admin/tests-adresses',
    label: "Tests d'adresses",
  },
  {
    group: 'tools',
    href: '/admin/iframes',
    label: "Générateur d'iframes",
  },
  {
    group: 'tools',
    href: '/admin/impostures',
    label: 'Impostures',
  },
  {
    group: 'tools',
    href: '/admin/emails',
    label: 'Emails automatiques',
  },
  {
    group: 'tools',
    href: '/admin/email-delivery',
    label: 'Délivrabilité des emails',
  },
  {
    group: 'tools',
    href: '/admin/doc',
    label: 'Documentation des workflows',
  },
  {
    group: 'system',
    href: '/admin/jobs',
    label: 'Suivi des tâches',
  },
  {
    group: 'system',
    href: '/admin/retention',
    label: 'Conservation des données',
  },
  {
    group: 'system',
    href: '/admin/diagnostic',
    label: 'Diagnostic système',
  },
  {
    // temporary page, to remove with the particulier role once the accounts are deleted
    group: 'system',
    href: '/admin/suppression-comptes-particuliers',
    label: 'Suppression des comptes particuliers',
  },
] as const satisfies readonly {
  group: AdminPageGroup;
  href: string;
  label: string;
}[];

export type AdminPage = (typeof adminPages)[number];
