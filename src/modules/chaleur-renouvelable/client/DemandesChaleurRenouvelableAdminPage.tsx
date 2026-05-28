import type { ColumnFiltersState } from '@tanstack/react-table';
import { useCallback, useMemo, useState } from 'react';

import Select from '@/components/form/dsfr/Select';
import SimplePage from '@/components/shared/page/SimplePage';
import ChipAutoComplete, { type ChipOption } from '@/components/ui/ChipAutoComplete';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import { useFetch } from '@/hooks/useApi';
import { getEspaceExterieurOptionLabel, PROJECT_STATUS_VALUES, typeLogementOptions } from '@/modules/chaleur-renouvelable/constants';
import { type DemandStatus, demandStatuses } from '@/modules/demands/constants';
import { toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

type DemandesChaleurRenouvelableAdminItem = RouterOutput['batEnr']['admin']['listDemandesChaleurRenouvelable']['items'][number];

const TABLE_URL_SYNC_KEY = 'demandes_chaleur_renouvelable';

const defaultAssignmentChipOption: ChipOption = {
  className: 'bg-gray-200 text-gray-900',
  key: 'Non affecté',
  label: 'Non affecté',
  title: '',
};

const quickFilterPresets = {
  all: {
    filters: [],
    getStat: (demands) => demands.length,
    label: 'demandes totales',
  },
  demandesMoisEnCours: {
    filters: [
      {
        id: 'created_at',
        value: [dayjs().startOf('month').format('YYYY-MM-DD'), dayjs().endOf('month').format('YYYY-MM-DD'), false],
      },
    ],
    getStat: (demands) => demands.filter((demand) => dayjs(demand.created_at).isSame(dayjs(), 'month')).length,
    label: `en ${dayjs().format('MMMM')}`,
  },
} satisfies Record<string, QuickFilterPreset<DemandesChaleurRenouvelableAdminItem>>;

export default function DemandesChaleurRenouvelableAdminPage() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { data, isLoading } = trpc.batEnr.admin.listDemandesChaleurRenouvelable.useQuery();
  const demands = data?.items ?? [];
  const { data: assignmentRulesResults = [] } = useFetch<string[]>('/api/admin/assignment-rules/results');
  const assignmentRulesResultsOptions: ChipOption[] = useMemo(
    () => [
      ...assignmentRulesResults.map((rule) => ({
        key: rule,
        label: rule,
      })),
      defaultAssignmentChipOption,
    ],
    [assignmentRulesResults]
  );
  const utils = trpc.useUtils();
  const { mutateAsync: updateDemandMutation } = trpc.batEnr.admin.updateDemandeChaleurRenouvelable.useMutation();

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: { assigned_to?: string | null; status?: DemandStatus }) => {
      utils.batEnr.admin.listDemandesChaleurRenouvelable.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;

        return {
          count: demandsData.count,
          items: demandsData.items.map((demand) => (demand.id === demandId ? { ...demand, ...demandUpdate } : demand)),
        };
      });

      await updateDemandMutation({
        demandId,
        values: {
          ...(demandUpdate.assigned_to !== undefined && { assignedTo: demandUpdate.assigned_to }),
          ...(demandUpdate.status !== undefined && { status: demandUpdate.status }),
        },
      });
    }),
    [updateDemandMutation, utils]
  );

  const columns: ColumnDef<DemandesChaleurRenouvelableAdminItem>[] = useMemo(
    () => [
      {
        accessorFn: (row) => row.created_at,
        cellType: 'DateTime',
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Date de la demande',
        id: 'Date de la demande',
        width: '110px',
      },
      {
        accessorFn: (row) => `${row.last_name} ${row.first_name} ${row.email} ${row.phone}`,
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-semibold">
              {row.original.first_name} {row.original.last_name}
            </span>
            <a className="link link-neutral text-sm" href={`mailto:${row.original.email}`}>
              {row.original.email}
            </a>
            {row.original.phone ? <span className="text-sm text-gray-600">{row.original.phone}</span> : null}
          </div>
        ),
        enableSorting: false,
        header: 'Contact',
        id: 'Contact',
        width: '260px',
      },
      {
        accessorKey: 'address',
        cell: ({ row }) => <span className="font-medium">{row.original.address}</span>,
        header: 'Adresse',
        width: '280px',
      },
      {
        accessorKey: 'status',
        cell: ({ row }) => (
          <Select
            label=""
            options={demandStatuses.map((status) => ({
              label: status.label,
              value: status.label,
            }))}
            size="sm"
            nativeSelectProps={{
              'aria-label': 'Statut de la demande',
              onChange: (event) => void updateDemand(row.original.id, { status: event.target.value as DemandStatus }),
              value: row.original.status as DemandStatus,
            }}
          />
        ),
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Statut',
        width: '290px',
      },
      {
        accessorKey: 'assigned_to',
        cell: ({ row }) => (
          <ChipAutoComplete
            options={assignmentRulesResultsOptions}
            defaultOption={defaultAssignmentChipOption}
            value={row.original.assigned_to ?? defaultAssignmentChipOption.key}
            onChange={(value) =>
              void updateDemand(row.original.id, {
                assigned_to: value === defaultAssignmentChipOption.key ? null : value,
              })
            }
          />
        ),
        enableSorting: false,
        header: 'Affecté à',
        width: '200px',
      },
      {
        accessorFn: (row) =>
          Object.fromEntries(typeLogementOptions.map((option) => [option.value, option.label]))[row.housing_type] ?? row.housing_type,
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Type de logement',
        id: 'Type de logement',
        width: '190px',
      },
      {
        accessorFn: (row) => getEspaceExterieurOptionLabel(row.housing_type, row.outdoor_space),
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Espace extérieur',
        id: 'Espace extérieur',
        width: '230px',
      },
      {
        accessorKey: 'dpe',
        align: 'center',
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'DPE',
        width: '80px',
      },
      {
        accessorKey: 'heating_energy',
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Énergie de chauffage',
        width: '160px',
      },
      {
        accessorKey: 'occupant_status',
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Statut occupant',
        width: '160px',
      },
      {
        accessorKey: 'project_status',
        cellType: 'Array',
        enableGlobalFilter: false,
        filter: 'arrayIncludesAny',
        filterProps: {
          label: 'Filtrer par avancement du projet',
          options: PROJECT_STATUS_VALUES.map((status) => ({
            label: status,
            value: status,
          })),
          placeholder: 'Sélectionner un statut...',
        },
        filtersDialogLabel: 'Où en êtes-vous de votre projet ?',
        filterType: 'ComboBox',
        header: 'Projet',
        width: '300px',
      },
      {
        accessorKey: 'housing_count',
        align: 'right',
        cellType: 'Number',
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Logements',
        width: '110px',
      },
      {
        accessorKey: 'average_area',
        align: 'right',
        cellType: 'Number',
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Surface moyenne',
        suffix: <span className="ml-1">m²</span>,
        width: '130px',
      },
      {
        accessorKey: 'average_residents',
        align: 'right',
        cellType: 'Number',
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Habitants moyens',
        width: '140px',
      },
      {
        accessorKey: 'simulation_url',
        cell: ({ row }) => (
          <a className="link link-neutral" href={row.original.simulation_url} target="_blank" rel="noreferrer">
            Ouvrir
          </a>
        ),
        enableSorting: false,
        header: 'Simulation',
        width: '110px',
      },
    ],
    [assignmentRulesResultsOptions, updateDemand]
  );

  return (
    <SimplePage
      title="Gestion des demandes chaleur renouvelable"
      description="Tableau d'administration des demandes issues du simulateur chaleur renouvelable"
      mode="authenticated"
    >
      <div className="fr-container py-8">
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <QuickFilterPresets
            presets={quickFilterPresets}
            data={demands}
            loading={isLoading}
            columnFilters={columnFilters}
            onFiltersChange={setColumnFilters}
          />
          <p className="mb-0 text-sm text-gray-600">{data?.count ?? 0} demande(s) au total</p>
        </div>
        <TableSimple
          columns={columns}
          data={demands}
          loading={isLoading}
          initialSortingState={[{ desc: true, id: 'Date de la demande' }]}
          columnFilters={columnFilters}
          fluid
          controlsLayout="block"
          padding="sm"
          loadingEmptyMessage="Aucune demande chaleur renouvelable à afficher"
          urlSyncKey={TABLE_URL_SYNC_KEY}
          enableGlobalFilter
          enableFiltersDialog
          export={{
            fileName: 'demandes-chaleur-renouvelable.xlsx',
            sheetName: 'Demandes',
          }}
        />
      </div>
    </SimplePage>
  );
}
