import type { ColumnFiltersState } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import {
  getEspaceExterieurLabel,
  modeEauChaudeSanitaireOptions,
  PROJECT_STATUS_VALUES,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

type DemandesChaleurRenouvelableCcrtItem = RouterOutput['batEnr']['ccrt']['listDemandesChaleurRenouvelable']['items'][number];

const TABLE_URL_SYNC_KEY = 'demandes_chaleur_renouvelable_ccrt';

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
} satisfies Record<string, QuickFilterPreset<DemandesChaleurRenouvelableCcrtItem>>;

/**
 * CCRT workspace for demandes created by the renewable heat experimentation.
 */
export default function DemandesChaleurRenouvelableCcrtPage() {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const { data, isLoading } = trpc.batEnr.ccrt.listDemandesChaleurRenouvelable.useQuery();
  const demands = data?.items ?? [];
  const typeLogementLabels = useMemo(() => Object.fromEntries(typeLogementOptions.map((option) => [option.value, option.label])), []);

  const columns: ColumnDef<DemandesChaleurRenouvelableCcrtItem>[] = useMemo(
    () => [
      {
        accessorFn: (row) => row.created_at,
        cellType: 'DateTime',
        enableGlobalFilter: false,
        filterType: 'Range',
        header: 'Date de la demande',
        id: 'Date de la demande',
        width: '120px',
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
        width: '300px',
      },
      {
        accessorFn: (row) => typeLogementLabels[row.housing_type] ?? row.housing_type,
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Type de logement',
        id: 'Type de logement',
        width: '190px',
      },
      {
        accessorFn: (row) => getEspaceExterieurLabel(row.outdoor_space),
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
        header: 'Énergie',
        width: '130px',
      },
      {
        accessorKey: 'annual_heating_consumption',
        align: 'right',
        cellProps: { maximumFractionDigits: 2 },
        cellType: 'Number',
        enableGlobalFilter: false,
        exportHeader: 'Consommations annuelles de chauffage (MWh)',
        filterType: 'Range',
        header: 'Conso chauffage',
        suffix: <span className="ml-1">MWh</span>,
        width: '150px',
      },
      {
        accessorFn: (row) =>
          modeEauChaudeSanitaireOptions.find((option) => option.value === row.hot_water_system_type)?.label ?? 'Non renseigné',
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'ECS',
        id: 'ECS',
        width: '130px',
      },
      {
        accessorFn: (row) => typeRadiateurOptions.find((option) => option.value === row.radiator_type)?.label ?? 'Non renseigné',
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Radiateurs',
        id: 'Radiateurs',
        width: '240px',
      },
      {
        accessorKey: 'occupant_status',
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Statut occupant',
        width: '180px',
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
        accessorFn: (row) => row.comments ?? 'Non renseigné',
        header: 'Commentaires',
        id: 'Commentaires',
        width: '320px',
      },
      {
        accessorFn: (row) => row.batiment_construction_id ?? 'Non renseigné',
        header: 'Bâtiment',
        id: 'Bâtiment',
        width: '190px',
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
    [typeLogementLabels]
  );

  return (
    <SimplePage
      title="Demandes chaleur renouvelable"
      description="Demandes d’accompagnement issues du simulateur chaleur renouvelable"
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
            fileName: 'demandes-chaleur-renouvelable-ccrt.xlsx',
            sheetName: 'Demandes',
          }}
        />
      </div>
    </SimplePage>
  );
}
