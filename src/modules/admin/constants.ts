import { networkChangeRequestStatusLabels } from '@/modules/network-change-requests/constants';

/** Deep link to a table page with its column filters preset (same URL format as `TableSimple` `urlSyncKey`). */
const tableLink = (href: string, urlSyncKey: string, filters: { id: string; value: unknown }[]) =>
  `${href}?${urlSyncKey}_filters=${encodeURIComponent(JSON.stringify(filters))}`;

/** Fields of work of the FCU team, in display order: the tag of each anomaly on the admin dashboard, and the groups of the documentation. */
export const adminDashboardThemeIds = ['demands', 'networks', 'managers', 'accounts', 'technical'] as const;
export type AdminDashboardThemeId = (typeof adminDashboardThemeIds)[number];

export const adminDashboardThemeLabels = {
  accounts: 'Comptes',
  demands: 'Demandes',
  managers: 'Gestionnaires',
  networks: 'Réseaux et PDP',
  technical: 'Technique',
} as const satisfies Record<AdminDashboardThemeId, string>;

/** Permanent counters of the admin dashboard: the work queues of the FCU team, shown even when empty. */
export const adminDashboardIndicators = [
  {
    description: "Demandes de raccordement dont l'affectation au réseau n'a pas encore été validée",
    href: tableLink('/admin/demandes', 'demands', [{ id: 'validated', value: { false: true, true: false } }]),
    key: 'demandsToValidate',
    label: 'Demandes réseau de chaleur à valider',
    theme: 'demands',
  },
  {
    description: 'Demandes de réaffectation formulées par une collectivité, ALEC, CCRT ou gestionnaire et non encore traitées',
    href: tableLink('/admin/demandes', 'demands', [{ id: 'pending_assignment_change_present', value: { Non: false, Oui: true } }]),
    key: 'pendingReassignments',
    label: 'Réaffectations en attente',
    theme: 'demands',
  },
  {
    description: 'Demandes issues du parcours chaleur renouvelable non encore validées',
    href: '/admin/demandes-chaleur-renouvelable?demandes_chaleur_renouvelable_tab=awaiting_validation',
    key: 'renewableHeatDemandsToValidate',
    label: 'Demandes chaleur renouvelable à valider',
    theme: 'demands',
  },
  {
    description: 'Demandes de modification de fiche, de tracé ou de périmètre déposées par les collectivités et exploitants',
    href: tableLink('/admin/modifications-reseau', 'modifications_reseau', [
      { id: 'status', value: { [networkChangeRequestStatusLabels.pending]: true } },
    ]),
    key: 'networkChangeRequestsPending',
    label: 'Modifications de réseau à traiter',
    theme: 'networks',
  },
  {
    description: "Réseaux correspondant au motif d'une organisation sans y être rattachés, ou rattachés hors de tout motif",
    href: '/admin/organizations',
    key: 'organizationNetworksDrift',
    label: 'Écarts de rattachement aux organisations',
    theme: 'managers',
  },
  {
    description: 'Tâches asynchrones terminées en erreur au cours des 7 derniers jours',
    href: '/admin/jobs',
    key: 'jobsInError',
    label: 'Tâches en erreur (7 jours)',
    theme: 'technical',
  },
] as const satisfies readonly { description: string; href: string; key: string; label: string; theme: AdminDashboardThemeId }[];

export type AdminDashboardIndicatorKey = (typeof adminDashboardIndicators)[number]['key'];
export type AdminDashboardIndicators = Record<AdminDashboardIndicatorKey, number>;
