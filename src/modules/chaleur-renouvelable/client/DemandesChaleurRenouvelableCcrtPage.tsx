import type { ColumnFiltersState } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Select from '@/components/form/dsfr/Select';
import SimplePage from '@/components/shared/page/SimplePage';
import QuickFilterPresets from '@/components/ui/QuickFilterPresets';
import TableSimple, { type ColumnDef, type QuickFilterPreset } from '@/components/ui/table/TableSimple';
import { trackPostHogEvent } from '@/modules/analytics/client';
import {
  DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION,
  DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS,
  type DemandeChaleurRenouvelableProjectState,
  type DemandeChaleurRenouvelableStatus,
  demandeChaleurRenouvelableProjectStates,
  demandeChaleurRenouvelableStatuses,
  getEspaceExterieurLabel,
  modeEauChaudeSanitaireOptions,
  PROJECT_STATUS_VALUES,
  typeLogementOptions,
  typeRadiateurOptions,
} from '@/modules/chaleur-renouvelable/constants';
import { toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

type DemandesChaleurRenouvelableCcrtItem = RouterOutput['batEnr']['ccrt']['listDemandesChaleurRenouvelable']['items'][number];

const TABLE_URL_SYNC_KEY = 'demandes_chaleur_renouvelable_ccrt';

type DemandUpdate = {
  project_state?: DemandeChaleurRenouvelableProjectState;
  status?: DemandeChaleurRenouvelableStatus;
};

const statusOptions = demandeChaleurRenouvelableStatuses.map((status) => ({
  label: status.label,
  value: status.label,
}));

const projectStateOptions = demandeChaleurRenouvelableProjectStates.map((projectState) => ({
  label: projectState.label,
  value: projectState.label,
}));

const quickFilterPresets = {
  all: {
    filters: [],
    getStat: (demands) => demands.length,
    label: 'demandes totales',
  },
  demandesATraiter: {
    filters: [{ id: 'status', value: { [DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS]: true } }],
    getStat: (demands) => demands.filter((demand) => demand.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS).length,
    label: 'à traiter',
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
  const listViewTrackedRef = useRef(false);
  const typeLogementLabels = useMemo(() => Object.fromEntries(typeLogementOptions.map((option) => [option.value, option.label])), []);
  const utils = trpc.useUtils();
  const { mutateAsync: updateDemandMutation } = trpc.batEnr.ccrt.updateDemandeChaleurRenouvelable.useMutation();

  useEffect(() => {
    if (!data || listViewTrackedRef.current) {
      return;
    }

    trackPostHogEvent('ccrt_demandes:list_viewed', {
      departement: data.trackingContext.departements.join(',') || null,
      onglet: 'toutes',
      structure_ccrt: data.trackingContext.structure_ccrt,
    });
    listViewTrackedRef.current = true;
  }, [data]);

  const getDemandTrackingProps = useCallback(
    (demand: DemandesChaleurRenouvelableCcrtItem) => ({
      demande_id: demand.id,
      departement: demand.departement_code,
      solution_1: demand.alternative_heating_solutions[0] ?? null,
      structure_ccrt: data?.trackingContext.structure_ccrt ?? null,
    }),
    [data?.trackingContext.structure_ccrt]
  );

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: DemandUpdate, trigger: 'contact' | 'manual' = 'manual') => {
      const optimisticDemandUpdate = {
        ...demandUpdate,
        ...(demandUpdate.status !== undefined &&
          demandUpdate.status !== DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION && {
            project_state: DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
          }),
      };

      utils.batEnr.ccrt.listDemandesChaleurRenouvelable.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;

        return {
          ...demandsData,
          items: demandsData.items.map((demand) => (demand.id === demandId ? { ...demand, ...optimisticDemandUpdate } : demand)),
        };
      });

      await updateDemandMutation({
        demandId,
        trigger,
        values: {
          ...(demandUpdate.project_state !== undefined && { projectState: demandUpdate.project_state }),
          ...(demandUpdate.status !== undefined && { status: demandUpdate.status }),
        },
      });
      await utils.batEnr.admin.listDemandesChaleurRenouvelable.invalidate();
    }),
    [updateDemandMutation, utils]
  );

  const trackContact = useCallback(
    (demand: DemandesChaleurRenouvelableCcrtItem, contactType: 'email' | 'phone') => {
      const trackingProps = { ...getDemandTrackingProps(demand), emplacement: 'liste' as const };
      trackPostHogEvent('ccrt_demande:contact_clicked', trackingProps);
      trackPostHogEvent(
        contactType === 'email' ? 'ccrt_demande:contact_email_clicked' : 'ccrt_demande:contact_phone_clicked',
        trackingProps
      );

      if (demand.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_TO_PROCESS) {
        void updateDemand(demand.id, { status: DEMANDE_CHALEUR_RENOUVELABLE_STATUS_FIRST_CONTACT }, 'contact');
      }
    },
    [getDemandTrackingProps, updateDemand]
  );

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
            <a
              className="link link-neutral text-sm"
              href={`mailto:${row.original.email}`}
              onClick={() => trackContact(row.original, 'email')}
            >
              {row.original.email}
            </a>
            {row.original.phone ? (
              <a
                className="link link-neutral text-sm"
                href={`tel:${row.original.phone}`}
                onClick={() => trackContact(row.original, 'phone')}
              >
                {row.original.phone}
              </a>
            ) : null}
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
        accessorKey: 'status',
        cell: ({ row }) => (
          <Select
            label=""
            options={statusOptions}
            size="sm"
            nativeSelectProps={{
              'aria-label': 'Statut de la demande',
              onChange: (event) => void updateDemand(row.original.id, { status: event.target.value as DemandeChaleurRenouvelableStatus }),
              value: row.original.status as DemandeChaleurRenouvelableStatus,
            }}
          />
        ),
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'Statut',
        width: '290px',
      },
      {
        accessorFn: (row) =>
          row.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION
            ? row.project_state
            : DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
        cell: ({ row }) => {
          const isProjectStateEditable = row.original.status === DEMANDE_CHALEUR_RENOUVELABLE_STATUS_PROJECT_VALIDATION;

          return (
            <Select
              disabled={!isProjectStateEditable}
              label=""
              options={projectStateOptions}
              size="sm"
              nativeSelectProps={{
                'aria-label': 'État du projet',
                onChange: (event) =>
                  void updateDemand(row.original.id, { project_state: event.target.value as DemandeChaleurRenouvelableProjectState }),
                value: isProjectStateEditable
                  ? (row.original.project_state as DemandeChaleurRenouvelableProjectState)
                  : DEMANDE_CHALEUR_RENOUVELABLE_PROJECT_STATE_REFLECTION,
              }}
            />
          );
        },
        enableGlobalFilter: false,
        filterType: 'Facets',
        header: 'État du projet',
        id: 'État du projet',
        width: '280px',
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
        accessorKey: 'alternative_heating_solutions',
        cellType: 'Array',
        enableGlobalFilter: true,
        header: 'Solutions',
        width: '260px',
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
        accessorFn: (row) => row.rnic_nom_copropriete ?? 'Non renseigné',
        header: 'Copropriété RNIC',
        id: 'Copropriété RNIC',
        width: '240px',
      },
      {
        accessorFn: (row) => row.rnic_numero_immatriculation ?? 'Non renseigné',
        header: 'Immatriculation RNIC',
        id: 'Immatriculation RNIC',
        width: '180px',
      },
      {
        accessorFn: (row) => row.rnic_siret_representant_legal ?? 'Non renseigné',
        header: 'SIRET représentant légal RNIC',
        id: 'SIRET représentant légal RNIC',
        width: '210px',
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
          <a
            className="link link-neutral"
            href={row.original.simulation_url}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              trackPostHogEvent('ccrt_demande:simulation_viewed', {
                ...getDemandTrackingProps(row.original),
                emplacement: 'liste',
              })
            }
          >
            Ouvrir
          </a>
        ),
        enableSorting: false,
        header: 'Simulation',
        width: '110px',
      },
    ],
    [getDemandTrackingProps, trackContact, typeLogementLabels, updateDemand]
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
