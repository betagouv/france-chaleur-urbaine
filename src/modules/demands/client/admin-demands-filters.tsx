import { getModeDeChauffageDisplay } from '@/components/Manager/ModeDeChauffageTag';
import Icon from '@/components/ui/Icon';
import Tooltip from '@/components/ui/Tooltip';
import type { FilterDef, FilterValuesOf } from '@/modules/data-table/filters/filter-types';
import type { DataTablePreset } from '@/modules/data-table/types';
import type { RouterOutput } from '@/modules/trpc/client';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';
import { dayjs } from '@/utils/date';

import { type DemandStatus, eligibilityTitleByType, eligibilityTypes } from '../constants';
import DemandStatusBadge from './DemandStatusBadge';

export type AdminDemandItem = RouterOutput['demands']['admin']['list']['items'][number];

/** Filters of the admin demands table; the source filter shows integration labels resolved by the page. */
export const buildAdminDemandsFilters = (integrationLabelById: Record<string, string>) =>
  [
    {
      formatOption: (key: string) => <DemandStatusBadge status={key as DemandStatus} />,
      getValue: (row: AdminDemandItem) => row.Status,
      id: 'Status',
      label: 'Statut',
      type: 'facets',
    },
    {
      getValue: (row: AdminDemandItem) => row.validated,
      id: 'validated',
      label: 'Validée',
      type: 'facets',
    },
    {
      getValue: (row: AdminDemandItem) => row.pending_assignment_change !== null,
      id: 'pending_assignment_change',
      label: 'Réaffectation en attente',
      type: 'facets',
    },
    {
      getValue: (row: AdminDemandItem) => row['Date de la demande'],
      id: 'date',
      label: 'Date de la demande',
      type: 'dateRange',
    },
    {
      display: 'combobox',
      getValue: (row: AdminDemandItem) => row.network_name,
      id: 'network_name',
      label: 'Réseau affecté',
      type: 'facets',
    },
    {
      display: 'combobox',
      getValue: (row: AdminDemandItem) => (row.network_id ? `${row.network_type}:${row.network_id}` : null),
      id: 'network_id',
      label: 'Réseau affecté (identifiant)',
      type: 'facets',
    },
    {
      display: 'combobox',
      getValue: (row: AdminDemandItem) => row.testAddress.eligibility?.id_sncu,
      id: 'id_sncu',
      label: 'Réseau le plus proche',
      type: 'facets',
    },
    {
      formatOption: (key: string) => eligibilityTitleByType[key as keyof typeof eligibilityTitleByType] ?? key,
      getValue: (row: AdminDemandItem) => row.testAddress.eligibility?.type,
      id: 'eligibility_type',
      label: 'Éligibilité',
      type: 'facets',
    },
    {
      getValue: (row: AdminDemandItem) => row['en PDP'],
      id: 'en_pdp',
      label: 'En PDP',
      type: 'facets',
    },
    {
      getValue: (row: AdminDemandItem) => row['Recontacté par le gestionnaire'] || null,
      id: 'recontacte',
      label: 'Recontacté par le gestionnaire',
      type: 'facets',
    },
    {
      getValue: (row: AdminDemandItem) =>
        row.access_counts.gestionnaire + row.access_counts.collectivite + row.access_counts.alec + row.access_counts.ccrt,
      id: 'access',
      label: 'Nombre d’accès',
      type: 'range',
    },
    {
      getValue: (row: AdminDemandItem) => row.Structure,
      id: 'Structure',
      label: 'Type de structure',
      type: 'facets',
    },
    {
      getValue: (row: AdminDemandItem) =>
        getModeDeChauffageDisplay({ modeDeChauffage: row['Mode de chauffage'], typeDeChauffage: row['Type de chauffage'] }),
      id: 'mode_de_chauffage',
      label: 'Mode de chauffage',
      type: 'facets',
    },
    {
      formatOption: (key: string) => integrationLabelById[key] ?? key,
      getValue: (row: AdminDemandItem) => row.origin_source,
      id: 'origin_source',
      label: 'Source',
      type: 'facets',
    },
    {
      description: 'Filtrer par code département.',
      display: 'combobox',
      getValue: (row: AdminDemandItem) => row.departement_code,
      id: 'departement',
      label: 'Département',
      type: 'facets',
    },
    {
      getValue: (row: AdminDemandItem) => row.Sondage,
      id: 'Sondage',
      label: 'Sondage',
      type: 'facets',
    },
  ] as const satisfies readonly FilterDef<AdminDemandItem>[];

export type AdminDemandsFilters = ReturnType<typeof buildAdminDemandsFilters>;
export type AdminDemandsFilterValues = FilterValuesOf<AdminDemandItem, AdminDemandsFilters>;

const eligibilityTypesNotTooFar = eligibilityTypes
  .filter((eligibilityCase) => eligibilityCase.type !== 'trop_eloigne')
  .map((eligibilityCase) => eligibilityCase.type);

/** Quick presets of the admin demands table; the first one is applied when the URL carries no filter. */
export const adminDemandsPresets: DataTablePreset<AdminDemandItem, AdminDemandsFilters>[] = [
  {
    filters: { validated: ['false'] },
    getCount: (demands) => demands.filter((demand) => !demand.validated).length,
    id: 'aValider',
    label: (
      <>
        à valider&nbsp;
        <Tooltip title="Demandes dont l'affectation réseau n'a pas encore été validée" />
      </>
    ),
    valueSuffix: <Icon name="fr-icon-flag-fill" size="sm" color="red" />,
  },
  {
    filters: { pending_assignment_change: ['true'] },
    getCount: (demands) => demands.filter((demand) => demand.pending_assignment_change !== null).length,
    id: 'reaffectationsEnAttente',
    label: (
      <>
        réaffectations&nbsp;
        <br />
        en attente&nbsp;
        <Tooltip title="Demandes de réaffectation formulées par une collectivité/ALEC/CCRT/gestionnaire et non encore traitées." />
      </>
    ),
    valueSuffix: <Icon name="fr-icon-arrow-left-right-line" size="sm" color="var(--text-default-warning)" />,
  },
  {
    filters: { date: { from: dayjs().startOf('month').format('YYYY-MM-DD'), to: dayjs().endOf('month').format('YYYY-MM-DD') } },
    getCount: (demands) => demands.filter((demand) => dayjs(demand['Date de la demande']).isSame(dayjs(), 'month')).length,
    id: 'moisEnCours',
    label: `en ${dayjs().format('MMMM')}`,
  },
  {
    filters: { eligibility_type: eligibilityTypesNotTooFar, Status: [DEMANDE_STATUS.TO_PROCESS] },
    getCount: (demands) =>
      demands.filter((demand) => demand.Status === DEMANDE_STATUS.TO_PROCESS && demand.testAddress.eligibility?.type !== 'trop_eloigne')
        .length,
    id: 'aTraiter',
    label: (
      <>
        à traiter&nbsp;
        <Tooltip title={`Le statut de la demande est "À traiter" et l'adresse n'est pas trop éloignée d'un réseau.`} />
      </>
    ),
  },
  {
    filters: {},
    getCount: (demands) => demands.length,
    id: 'all',
    label: 'demandes totales',
  },
];
