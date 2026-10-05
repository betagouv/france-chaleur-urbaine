import { networkChangeRequestStatusLabels } from '@/modules/network-change-requests/constants';

/** Deep link to a table page with its column filters preset (same URL format as `TableSimple` `urlSyncKey`). */
const tableLink = (href: string, urlSyncKey: string, filters: { id: string; value: unknown }[]) =>
  `${href}?${urlSyncKey}_filters=${encodeURIComponent(JSON.stringify(filters))}`;

/** Indicators of the admin dashboard: things waiting for an action from the FCU team. */
export const adminDashboardIndicators = [
  {
    description: "Demandes de raccordement dont l'affectation au réseau n'a pas encore été validée",
    href: tableLink('/admin/demandes', 'demands', [{ id: 'validated', value: { false: true, true: false } }]),
    key: 'demandsToValidate',
    label: 'Demandes à valider',
  },
  {
    description: 'Demandes de réaffectation formulées par une collectivité, ALEC, CCRT ou gestionnaire et non encore traitées',
    href: tableLink('/admin/demandes', 'demands', [{ id: 'pending_assignment_change_present', value: { Non: false, Oui: true } }]),
    key: 'pendingReassignments',
    label: 'Réaffectations en attente',
  },
  {
    description: 'Demandes issues du parcours chaleur renouvelable non encore validées',
    href: tableLink('/admin/demandes-chaleur-renouvelable', 'demandes_chaleur_renouvelable', [
      { id: 'validated', value: { false: true, true: false } },
    ]),
    key: 'renewableHeatDemandsToValidate',
    label: 'Demandes chaleur renouvelable à valider',
  },
  {
    description: 'Demandes de modification de fiche, de tracé ou de périmètre déposées par les collectivités et exploitants',
    href: tableLink('/admin/modifications-reseau', 'modifications_reseau', [
      { id: 'status', value: { [networkChangeRequestStatusLabels.pending]: true } },
    ]),
    key: 'networkChangeRequestsPending',
    label: 'Modifications de réseau à traiter',
  },
  {
    description: 'Tâches asynchrones terminées en erreur au cours des 7 derniers jours',
    href: '/admin/jobs',
    key: 'jobsInError',
    label: 'Tâches en erreur (7 jours)',
  },
] as const satisfies readonly { description: string; href: string; key: string; label: string }[];

export type AdminDashboardIndicatorKey = (typeof adminDashboardIndicators)[number]['key'];
export type AdminDashboardIndicators = Record<AdminDashboardIndicatorKey, number>;
