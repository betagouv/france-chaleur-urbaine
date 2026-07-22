/** Groups in display order (array order is preserved; biome would re-sort object keys). */
export const adminPageGroups = [
  { id: 'management', label: 'Gestion' },
  { id: 'analytics', label: 'Pilotage' },
  { id: 'tools', label: 'Outils' },
  { id: 'system', label: 'Système' },
] as const;

export type AdminPageGroup = (typeof adminPageGroups)[number]['id'];

/**
 * Single source of truth for the admin pages. Feeds both the admin dashboard
 * (`DashboardAdmin`) and the navigation menu (`SimplePage`). Add a page here to
 * expose it in both places. Keep entries grouped and ordered by `group`.
 */
export const adminPages = [
  {
    desc: 'Gérez les demandes de raccordement à affecter',
    group: 'management',
    href: '/admin/demandes',
    label: 'Gestion des demandes',
  },
  {
    desc: 'Gérez les demandes chaleur renouvelable',
    group: 'management',
    href: '/admin/demandes-chaleur-renouvelable',
    label: 'Gestion des demandes chaleur renouvelable',
  },
  {
    desc: "Gérez les utilisateurs de l'application",
    group: 'management',
    href: '/admin/users',
    label: 'Gestion des utilisateurs',
  },
  {
    desc: 'Gérez les réseaux de chaleur et de froid',
    group: 'management',
    href: '/admin/reseaux',
    label: 'Gestion des réseaux',
  },
  {
    desc: 'Gérez les organisations gestionnaires, leurs réseaux et accès API',
    group: 'management',
    href: '/admin/organizations',
    label: 'Gestion des organisations',
  },
  {
    desc: "Consultez l'activité des utilisateurs sur le site",
    group: 'analytics',
    href: '/admin/events',
    label: 'Activité du site',
  },
  {
    desc: 'Entonnoir affichages → tests → demandes, toutes sources',
    group: 'analytics',
    href: '/admin/conversion',
    label: 'Conversion par source',
  },
  {
    desc: 'Détecter et bannir les IP polluant les stats de conversion',
    group: 'analytics',
    href: '/admin/conversion/abus',
    label: 'Conversion — contrôle des abus',
  },
  {
    desc: 'Consultez les statistiques des demandes par réseau',
    group: 'analytics',
    href: '/admin/reseaux/stats',
    label: 'Statistiques par réseau',
  },
  {
    desc: "Consultez les tests d'éligibilité d'adresses réalisés par les utilisateurs",
    group: 'analytics',
    href: '/admin/tests-adresses',
    label: "Tests d'adresses",
  },
  {
    desc: "Générez l'URL et le code d'intégration d'une carte à embarquer",
    group: 'tools',
    href: '/admin/iframes',
    label: "Générateur d'iframes",
  },
  {
    desc: "Endossez un rôle et des permissions spécifiques pour tester l'application",
    group: 'tools',
    href: '/admin/impostures',
    label: 'Impostures',
  },
  {
    desc: "Prévisualisez les modèles d'emails envoyés par l'application",
    group: 'tools',
    href: '/admin/emails',
    label: "Modèles d'emails",
  },
  {
    desc: "Comprenez les parcours métier de l'application et leurs règles de gestion",
    group: 'tools',
    href: '/admin/doc',
    label: 'Documentation des workflows',
  },
  {
    desc: "Suivez l'état des tâches asynchrones et des crons",
    group: 'system',
    href: '/admin/jobs',
    label: 'Suivi des tâches',
  },
  {
    desc: "Vérifiez l'état des outils et configurations du système",
    group: 'system',
    href: '/admin/diagnostic',
    label: 'Diagnostic système',
  },
  {
    desc: 'Identifiez les incohérences (utilisateurs, permissions, demandes)',
    group: 'system',
    href: '/admin/data-diagnostic',
    label: 'Diagnostic des données',
  },
] as const satisfies readonly {
  desc: string;
  group: AdminPageGroup;
  href: string;
  label: string;
}[];

export type AdminPage = (typeof adminPages)[number];
