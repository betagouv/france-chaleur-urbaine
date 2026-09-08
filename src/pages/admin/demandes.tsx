import { usePrevious } from '@react-hookz/web';
import type { SortingState } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';

import TableAddressAutocomplete from '@/components/Admin/TableAddressAutocomplete';
import EligibilityHelpDialog from '@/components/EligibilityHelpDialog';
import Select from '@/components/form/dsfr/Select';
import DemandEmailModal from '@/components/Manager/DemandEmailModal';
import ModeDeChauffageTag, { getModeDeChauffageDisplay } from '@/components/Manager/ModeDeChauffageTag';
import Tag from '@/components/Manager/Tag';
import SimplePage from '@/components/shared/page/SimplePage';
import AsyncButton from '@/components/ui/AsyncButton';
import FCUBadge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import HamburgerMenu, { type HamburgerMenuItem } from '@/components/ui/HamburgerMenu';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@/components/ui/Resizable';
import Tooltip from '@/components/ui/Tooltip';
import { useDialogState } from '@/hooks/useDialogState';
import { cells } from '@/modules/data-table/cells';
import { accessorColumn } from '@/modules/data-table/columns';
import { DataTable } from '@/modules/data-table/DataTable';
import type { DataTableColumn } from '@/modules/data-table/types';
import { useDataTable } from '@/modules/data-table/useDataTable';
import AccessCountsCell from '@/modules/demands/client/AccessCountsCell';
import AffectedNetworkCell from '@/modules/demands/client/AffectedNetworkCell';
import { type AdminDemandItem, adminDemandsPresets, buildAdminDemandsFilters } from '@/modules/demands/client/admin-demands-filters';
import Comment from '@/modules/demands/client/Comment';
import Contact from '@/modules/demands/client/Contact';
import Status from '@/modules/demands/client/Status';
import { eligibilityTitleByType } from '@/modules/demands/constants';
import type { Demand } from '@/modules/demands/types';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { AdressesEligiblesLayer } from '@/modules/map/client/layers/AdressesEligiblesLayer';
import type { AdresseEligible } from '@/modules/map/client/layers/specs/adressesEligibles';
import { Map } from '@/modules/map/client/Map';
import { notify, toastErrors } from '@/modules/notification';
import EligibilityHistoryTooltip from '@/modules/pro-eligibility-tests/client/EligibilityHistoryTooltip';
import type { NetworkType } from '@/modules/reseaux/constants';
import trpc from '@/modules/trpc/client';
import { withAuthentication } from '@/server/authentication';
import type { Point } from '@/types/Point';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { stopPropagation } from '@/utils/events';

type DemandsListAdminItem = AdminDemandItem;

type MapCenterLocation = {
  center: Point;
  zoom: number;
  flyTo?: boolean;
};

const initialSorting: SortingState = [{ desc: true, id: 'Date de la demande' }];
const initialFilters = adminDemandsPresets[0].filters;
const emptyDemands: DemandsListAdminItem[] = [];
const getRowId = (row: DemandsListAdminItem) => row.id;

function DemandesAdmin(): React.ReactElement {
  const [selectedDemandId, setSelectedDemandId] = useState<string | null>(null);
  const [mapCenterLocation, setMapCenterLocation] = useState<MapCenterLocation>();
  const [modalDemand, setModalDemand] = useState<DemandsListAdminItem | null>(null);

  const handleEmailClick = useCallback((demand: Demand) => setModalDemand(demand as unknown as DemandsListAdminItem), []);

  const { data: demandsData, isLoading } = trpc.demands.admin.list.useQuery();
  const demands = demandsData?.items ?? emptyDemands;

  // `origin_source` stocke l'id (uuid) de l'intégration — on résout son label pour l'affichage.
  const { data: integrations = [] } = trpc.conversionTracking.sources.list.useQuery({ includeArchived: true });
  const integrationLabelById = useMemo<Record<string, string>>(
    () => Object.fromEntries(integrations.map((integration) => [integration.id, integration.label])),
    [integrations]
  );

  const utils = trpc.useUtils();
  const { mutateAsync: updateDemandMutation } = trpc.demands.admin.update.useMutation();
  const { mutateAsync: deleteDemandMutation } = trpc.demands.admin.delete.useMutation();

  const updateDemand = useCallback(
    toastErrors(async (demandId: string, demandUpdate: Partial<DemandsListAdminItem>) => {
      utils.demands.admin.list.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;
        return {
          count: demandsData.count,
          items: demandsData.items.map((demand) => {
            if (demand.id === demandId) {
              return { ...demand, ...demandUpdate };
            }
            return demand;
          }),
        };
      });

      // Convert null to undefined for fields that don't accept null
      const sanitizedUpdate = Object.fromEntries(
        Object.entries(demandUpdate).map(([key, value]) => [key, value === null ? undefined : value])
      );

      await updateDemandMutation({ demandId, values: sanitizedUpdate });
    }),
    [utils, updateDemandMutation]
  );

  const deleteDemand = useCallback(
    toastErrors(async (demandId: string) => {
      await deleteDemandMutation({ demandId });

      utils.demands.admin.list.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;
        return {
          count: demandsData.count - 1,
          items: demandsData.items.filter((demand) => demand.id !== demandId),
        };
      });
      notify('success', 'Demande supprimée');
    }),
    [utils, deleteDemandMutation]
  );

  const { mutateAsync: validateDemandMutation } = trpc.demands.admin.validate.useMutation();
  const { mutateAsync: changeAssignmentMutation } = trpc.demands.admin.changeAssignment.useMutation();

  const changeNetwork = useCallback(
    toastErrors(async (demandId: string, networkIdFcu: number | null, networkType: NetworkType | null) => {
      await changeAssignmentMutation({ demandId, networkIdFcu, networkType });
      await utils.demands.admin.list.invalidate();
    }),
    [utils, changeAssignmentMutation]
  );

  const validateDemand = useCallback(
    toastErrors(async (demandId: string) => {
      utils.demands.admin.list.setData(undefined, (demandsData) => {
        if (!demandsData) return demandsData;
        return {
          count: demandsData.count,
          items: demandsData.items.map((demand) => {
            if (demand.id === demandId) {
              return { ...demand, validated: true };
            }
            return demand;
          }),
        };
      });
      await validateDemandMutation({ demandId });
    }),
    [utils, validateDemandMutation]
  );

  const columns = useMemo<DataTableColumn<DemandsListAdminItem>[]>(
    () => [
      {
        align: 'center',
        cell: ({ row }) => (
          <div className="flex flex-col items-center gap-2">
            {!row.validated && (
              <Tooltip title="Cette demande n'a pas encore été validée">
                <Icon name="fr-icon-flag-fill" size="sm" color="red" />
              </Tooltip>
            )}
            {row.haut_potentiel && <FCUBadge type="haut_potentiel" />}
          </div>
        ),
        export: false,
        header: '',
        headerLabel: 'Indicateurs',
        id: 'indicators',
        width: 46,
      },
      {
        accessorKey: 'Status',
        cell: ({ row }) => (
          <div>
            <Status demand={row as unknown as Demand} updateDemand={updateDemand} className="mb-0!" />
            <div onClick={stopPropagation} onDoubleClick={stopPropagation}>
              <EligibilityHelpDialog detailedEligibilityStatus={row.testAddress.eligibility}>
                <Button
                  className="text-gray-700! font-normal! italic"
                  title="Voir le détail de l'éligibilité"
                  priority="tertiary no outline"
                  size="small"
                  iconId="fr-icon-info-line"
                >
                  {row.testAddress.eligibility?.type ? eligibilityTitleByType[row.testAddress.eligibility.type] : 'Non connu'}
                </Button>
              </EligibilityHelpDialog>
            </div>
          </div>
        ),
        header: 'Statut',
        width: 290,
      },
      {
        accessorKey: 'Recontacté par le gestionnaire',
        align: 'center',
        cell: ({ row, value }) => (
          <Select
            label=""
            options={[
              { label: 'Non renseigné', value: '' },
              { label: 'Oui', value: 'Oui' },
              { label: 'Non', value: 'Non' },
            ]}
            size="sm"
            nativeSelectProps={{
              'aria-label': 'Recontacté par le gestionnaire',
              onChange: (event) =>
                updateDemand(row.id, {
                  'Recontacté par le gestionnaire': event.target.value as Demand['Recontacté par le gestionnaire'],
                }),
              value: value || '',
            }}
          />
        ),
        header: (
          <>
            Recontacté par
            <br />
            le gestionnaire
          </>
        ),
        headerLabel: 'Recontacté par le gestionnaire',
        width: 155,
      },
      accessorColumn((row: DemandsListAdminItem) => row.network_name, {
        cell: ({ row }) => (
          <div className="w-full" onClick={stopPropagation} onDoubleClick={stopPropagation}>
            <AffectedNetworkCell demand={row} isAdmin onChangeNetwork={changeNetwork} />
          </div>
        ),
        header: 'Réseau affecté',
        id: 'network_name',
        sortable: false,
        width: 300,
      }),
      accessorColumn(
        (row: DemandsListAdminItem) =>
          row.access_counts.gestionnaire + row.access_counts.collectivite + row.access_counts.alec + row.access_counts.ccrt,
        {
          cell: ({ row }) => (
            <div onClick={stopPropagation} onDoubleClick={stopPropagation}>
              <AccessCountsCell demandId={row.id} accessCounts={row.access_counts} />
            </div>
          ),
          header: 'Accès',
          id: 'access',
          width: 135,
        }
      ),
      {
        accessorKey: 'validated',
        align: 'center',
        cell: ({ row, value }) => (
          <div onClick={stopPropagation} onDoubleClick={stopPropagation}>
            <ValidateDemandButton demandId={row.id} validated={value} onValidate={validateDemand} />
          </div>
        ),
        header: 'Validée',
        width: 110,
      },
      accessorColumn((row: DemandsListAdminItem) => `${row.Nom} ${row.Prénom} ${row.Mail}`, {
        cell: ({ row }) => <Contact demand={row as unknown as Demand} onEmailClick={handleEmailClick} />,
        header: 'Contact',
        id: 'contact',
        sortValue: (row) => `${row.Nom} ${row.Prénom}`,
        width: 280,
      }),
      {
        accessorKey: 'Structure',
        cell: ({ value }) => <Tag text={value} />,
        header: 'Type',
        sortable: false,
        width: 130,
      },
      accessorColumn(
        (row: DemandsListAdminItem) =>
          getModeDeChauffageDisplay({ modeDeChauffage: row['Mode de chauffage'], typeDeChauffage: row['Type de chauffage'] }),
        {
          cell: ({ row }) => <ModeDeChauffageTag modeDeChauffage={row['Mode de chauffage']} typeDeChauffage={row['Type de chauffage']} />,
          header: 'Mode de chauffage',
          id: 'mode_de_chauffage',
          sortable: false,
          width: 134,
        }
      ),
      accessorColumn((row: DemandsListAdminItem) => row.testAddress.ban_address, {
        cell: ({ row }) => <TableAddressAutocomplete demand={row} />,
        header: 'Adresse',
        id: 'adresse',
        sortable: false,
        width: 240,
      }),
      { accessorKey: 'Date de la demande', cell: cells.dateTime(), header: 'Date de la demande', width: 94 },
      accessorColumn(
        (row: DemandsListAdminItem) => (row.origin_source ? (integrationLabelById[row.origin_source] ?? row.origin_source) : null),
        {
          cell: ({ row, value }) =>
            row.origin_source && <Link href={`/admin/conversion?source=${encodeURIComponent(row.origin_source)}`}>{value}</Link>,
          header: 'Source',
          id: 'origin_source',
          width: 150,
        }
      ),
      { accessorKey: 'origin_page', header: 'Page source', sortable: false, width: 220 },
      { accessorKey: 'origin_host', header: 'Site hôte', sortable: false, width: 200 },
      {
        align: 'center',
        cell: ({ row }) => {
          const history = row.testAddress?.eligibility_history as any;
          if (!history || !Array.isArray(history) || history.length === 0) {
            return null;
          }
          return (
            <div className="flex items-center justify-center gap-1">
              <Tooltip title={<EligibilityHistoryTooltip history={history} />} side="left" />
            </div>
          );
        },
        export: false,
        header: 'Historique éligibilité',
        id: 'eligibility_history',
        width: 100,
      },
      { accessorKey: 'Commentaire relance', header: 'Commentaire relance', width: 280 },
      {
        accessorKey: 'comment_user',
        cell: ({ row }) => <Comment demand={row} field="comment_user" updateDemand={updateDemand} />,
        header: 'Commentaire demandeur',
        sortable: false,
        width: 280,
      },
      { accessorKey: 'comment_gestionnaire', header: 'Commentaire Gestionnaire', width: 280 },
      {
        accessorKey: 'comment_fcu',
        cell: ({ row }) => <Comment demand={row} field="comment_fcu" updateDemand={updateDemand} />,
        header: 'Commentaires internes FCU',
        sortable: false,
        width: 280,
      },
      { accessorKey: 'Sondage', cell: cells.list(), header: 'Sondage', width: 200 },
      {
        align: 'right',
        cell: ({ row }) => <DemandActions demand={row} onDelete={deleteDemand} />,
        export: false,
        header: '',
        headerLabel: 'Actions',
        id: 'actions',
        width: 50,
      },
    ],
    [updateDemand, changeNetwork, validateDemand, deleteDemand, handleEmailClick, integrationLabelById]
  );

  const filters = useMemo(() => buildAdminDemandsFilters(integrationLabelById), [integrationLabelById]);

  const table = useDataTable({
    columns,
    data: demands,
    filters,
    getRowId,
    initialFilters,
    initialSorting,
    search: { placeholder: 'Rechercher par nom, email, adresse...' },
    urlKey: 'demands',
  });
  const filteredDemands = table.rows;

  // Membership signature of the displayed demands: O(n), no deep compare. Sorting or editing a row keeps it unchanged.
  const filteredIds = useMemo(() => new Set(filteredDemands.map((demand) => demand.id)), [filteredDemands]);
  const previousFilteredIds = usePrevious(filteredIds);

  // When the displayed set changes (filters, search), drops the selection and centers the map on the first demand.
  useEffect(() => {
    const setChanged =
      !previousFilteredIds || previousFilteredIds.size !== filteredIds.size || [...filteredIds].some((id) => !previousFilteredIds.has(id));
    if (!setChanged) {
      return;
    }
    if (previousFilteredIds) {
      setSelectedDemandId(null);
    }
    const firstDemand = filteredDemands[0];
    if (firstDemand) {
      setMapCenterLocation({ center: [firstDemand.Longitude ?? 0, firstDemand.Latitude ?? 0], flyTo: true, zoom: 8 });
    }
  }, [filteredIds, previousFilteredIds, filteredDemands]);

  // Signature of the fields the map reads: a content edit (comment, numbers…) must not rebuild the FeatureCollection.
  const mapDataKey = useMemo(
    () =>
      filteredDemands
        .map(
          (demand) =>
            `${demand.id}:${demand.Latitude}:${demand.Longitude}:${demand.Structure}:${demand['Mode de chauffage']}:${demand['Type de chauffage']}:${demand.Adresse}`
        )
        .join('|'),
    [filteredDemands]
  );
  const filteredDemandsMapData = useMemo(
    () =>
      filteredDemands.map(
        (demand) =>
          ({
            address: demand.Adresse,
            id: demand.id,
            latitude: demand.Latitude ?? 0,
            longitude: demand.Longitude ?? 0,
            modeDeChauffage:
              getModeDeChauffageDisplay({
                modeDeChauffage: demand['Mode de chauffage'],
                typeDeChauffage: demand['Type de chauffage'],
              }) ?? undefined,
            typeDeLogement: demand.Structure,
          }) satisfies AdresseEligible
      ),
    [mapDataKey]
  );

  const onMarkerSelect = useCallback(
    (demandId: string) => {
      setSelectedDemandId(demandId);
      table.scrollToRow(demandId);
    },
    [table.scrollToRow]
  );

  const selectAndCenterOnDemand = useCallback(
    (demandId: string, zoom: number) => {
      setSelectedDemandId(demandId);
      const selectedDemand = demands.find((demand: DemandsListAdminItem) => demand.id === demandId);
      if (selectedDemand) {
        setMapCenterLocation({
          center: [selectedDemand.Longitude ?? 0, selectedDemand.Latitude ?? 0],
          flyTo: true,
          zoom,
        });
      }
    },
    [demands]
  );
  const onTableRowClick = useCallback((demand: DemandsListAdminItem) => selectAndCenterOnDemand(demand.id, 13), [selectAndCenterOnDemand]);
  const onTableRowDoubleClick = useCallback(
    (demand: DemandsListAdminItem) => selectAndCenterOnDemand(demand.id, 16),
    [selectAndCenterOnDemand]
  );

  return (
    <SimplePage
      title="Validation des demandes"
      description="Tableau de bord administrateur pour la validation des demandes de raccordement"
      mode="authenticated"
    >
      <DemandEmailModal demand={modalDemand as unknown as Demand | null} onClose={() => setModalDemand(null)} updateDemand={updateDemand} />
      <div className="mb-8">
        <ResizablePanelGroup orientation="horizontal" className="gap-4">
          <ResizablePanel defaultSize="66%">
            <DataTable
              table={table}
              loading={isLoading}
              rowHeight="lg"
              height="calc(100dvh - 290px)"
              presets={adminDemandsPresets}
              actions={<EligibilityHelpDialog />}
              selectedRowId={selectedDemandId}
              onRowClick={onTableRowClick}
              onRowDoubleClick={onTableRowDoubleClick}
              emptyMessage="Aucune demande à afficher"
            />
          </ResizablePanel>
          <ResizableSeparator />
          <ResizablePanel defaultSize="34%">
            <div className={cx('max-md:h-[600px] md:h-[calc(100dvh-164px)] bg-[#F8F4F0]')}>
              {isDefined(mapCenterLocation) ? (
                <Map
                  initialView={{ center: mapCenterLocation.center, zoom: mapCenterLocation.zoom }}
                  config={createMapConfiguration({
                    reseauxDeChaleur: {
                      show: true,
                    },
                    reseauxEnConstruction: true,
                    zonesDeDeveloppementPrioritaire: true,
                  })}
                >
                  <AdressesEligiblesLayer
                    adresses={filteredDemandsMapData}
                    flyToLocation={mapCenterLocation}
                    selectedId={selectedDemandId}
                    onSelect={onMarkerSelect}
                  />
                </Map>
              ) : isLoading ? (
                <div className="absolute inset-0 flex justify-center items-center animate-pulse">
                  <Loader size="lg" />
                </div>
              ) : null}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SimplePage>
  );
}

export default DemandesAdmin;

/**
 * Bouton de validation d'une demande.
 * Valider rend la demande visible aux gestionnaires, collectivités, ALEC et CCRT.
 */
function ValidateDemandButton({
  demandId,
  validated,
  onValidate,
}: {
  demandId: string;
  validated: boolean;
  onValidate: (demandId: string) => Promise<void>;
}) {
  if (validated) {
    return null;
  }
  return (
    <AsyncButton
      priority="primary"
      size="small"
      iconId="fr-icon-check-line"
      title="Valider la demande"
      onClick={() => onValidate(demandId)}
    >
      Valider
    </AsyncButton>
  );
}

function DemandActions({ demand, onDelete }: { demand: DemandsListAdminItem; onDelete: (demandId: string) => Promise<void> }) {
  const utils = trpc.useUtils();
  const deleteDialog = useDialogState();
  const { mutateAsync: recalculateEligibility } = trpc.demands.admin.recalculateEligibility.useMutation();
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  const runAction = async (itemId: string, fn: () => Promise<void>) => {
    setPendingItemId(itemId);
    try {
      await fn();
    } finally {
      setPendingItemId(null);
    }
  };

  const menuItems: HamburgerMenuItem[] = [
    ...(demand.network_sncu_id
      ? [
          {
            href: `/reseaux/${demand.network_sncu_id}`,
            icon: 'fr-icon-road-map-line' as const,
            id: 'fiche-reseau',
            label: 'Fiche réseau',
            target: '_blank' as const,
          },
        ]
      : []),
    ...(demand.network_name
      ? [
          {
            href: `/admin/reseaux/stats?reseaux_filters=${encodeURIComponent(JSON.stringify([{ id: 'reseau', value: demand.network_name }]))}`,
            icon: 'fr-icon-bar-chart-box-line' as const,
            id: 'stats-reseau',
            label: 'Statistiques du réseau',
            target: '_blank' as const,
          },
        ]
      : []),
    {
      href: `/admin/events?contextType=demand&contextId=${demand.id}`,
      icon: 'fr-icon-time-line',
      id: 'view-history',
      label: "Voir l'historique",
      target: '_blank',
    },
    {
      icon: 'fr-icon-refresh-line',
      id: 'recalculate-eligibility',
      label: "Recalculer l'éligibilité",
      loading: pendingItemId === 'recalculate-eligibility',
      onClick: () =>
        void runAction(
          'recalculate-eligibility',
          toastErrors(async () => {
            const result = await recalculateEligibility({ demandId: demand.id });
            await utils.demands.admin.list.invalidate();

            notify('success', `${result.banAddress} — ${result.type}`);
          })
        ),
    },
    {
      icon: 'fr-icon-delete-line',
      id: 'delete-demand',
      label: 'Supprimer la demande',
      loading: pendingItemId === 'delete-demand',
      onClick: () => deleteDialog.open(),
      variant: 'destructive',
    },
  ];

  return (
    <>
      <HamburgerMenu items={menuItems} />
      <ConfirmDialog
        control={deleteDialog}
        title="Supprimer la demande"
        confirmLabel="Supprimer"
        danger
        onConfirm={() => runAction('delete-demand', () => onDelete(demand.id))}
      >
        Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible.
      </ConfirmDialog>
    </>
  );
}

export const getServerSideProps = withAuthentication(['admin']);
