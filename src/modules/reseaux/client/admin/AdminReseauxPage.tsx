import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import TableFieldInput from '@/components/Admin/TableFieldInput';
import Checkbox from '@/components/form/dsfr/Checkbox';
import Input from '@/components/form/dsfr/Input';
import FCUTagAutocomplete from '@/components/form/FCUTagAutocomplete';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Loader from '@/components/ui/Loader';
import Notice from '@/components/ui/Notice';
import { ResizablePanel, ResizablePanelGroup, ResizableSeparator } from '@/components/ui/Resizable';
import Tag from '@/components/ui/Tag';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { FileDropHandler } from '@/modules/map/client/interactions/FileDropHandler';
import { MapFitBounds } from '@/modules/map/client/interactions/MapFitBounds';
import { CustomGeojsonLegend } from '@/modules/map/client/layers/specs/customGeojson.legend';
import { GeomUpdateLegend } from '@/modules/map/client/layers/specs/geomUpdate.legend';
import { PerimetresDeDeveloppementPrioritaireLegend } from '@/modules/map/client/layers/specs/perimetresDeDeveloppementPrioritaire.legend';
import { ReseauxDeChaleurLegend } from '@/modules/map/client/layers/specs/reseauxDeChaleur.legend';
import { ReseauxDeFroidLegend } from '@/modules/map/client/layers/specs/reseauxDeFroid.legend';
import { ReseauxEnConstructionLegend } from '@/modules/map/client/layers/specs/reseauxEnConstruction.legend';
import { type MapDynamicSource, useMapLayers } from '@/modules/map/client/layers/useMapLayers';
import { Map } from '@/modules/map/client/Map';
import { notify, toastErrors } from '@/modules/notification';
import DeleteNetworkDialog, { type NetworkToDelete } from '@/modules/reseaux/client/admin/DeleteNetworkDialog';
import { NotesCell } from '@/modules/reseaux/client/admin/NotesCell';
import { RemindersCell } from '@/modules/reseaux/client/admin/RemindersCell';
import type { NetworkEntityType } from '@/modules/reseaux/constants';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';

const tabIds = ['reseaux-de-chaleur', 'reseaux-de-froid', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire'] as const;

type ReseauDeChaleur = RouterOutput['reseaux']['reseauDeChaleur']['list'][number];
type ReseauDeFroid = RouterOutput['reseaux']['reseauDeFroid']['list'][number];
type ReseauEnConstruction = RouterOutput['reseaux']['reseauEnConstruction']['list'][number];
type PerimetreDeDeveloppementPrioritaire = RouterOutput['reseaux']['perimetreDeDeveloppementPrioritaire']['list'][number];

const ModifiedIcon = <T extends Record<string, any>>(record: T & { geom_delete: boolean; geom_update?: any; geom_create: boolean }) => {
  if (!record.geom_update && !record.geom_delete && !record.geom_create) {
    return null;
  }

  if (record.geom_create) {
    return <Icon name="fr-icon-add-circle-line" size="sm" color="success" title="Nouveau réseau créé" className="flex items-center" />;
  }

  return (
    <Icon
      name={record.geom_delete ? 'fr-icon-close-circle-line' : 'fr-icon-refresh-line'}
      size="sm"
      color="warning"
      title={record.geom_delete ? 'Géométrie supprimée' : 'Géométrie modifiée'}
      className="flex items-center"
    />
  );
};

/** Pushes the pending geom updates to the `geomUpdate` source (general layer, page-specific data). */
function GeomUpdateLayerData({ features }: { features: GeoJSON.Feature[] }) {
  const sources = useMemo<MapDynamicSource[]>(() => [{ data: { features, type: 'FeatureCollection' }, id: 'geomUpdate' }], [features]);
  useMapLayers({ sources });
  return null;
}

const GestionDesReseaux = () => {
  const [selectedTab, setSelectedTab] = useQueryState('reseauxTab', parseAsStringLiteral(tabIds).withDefault('reseaux-de-chaleur'));

  const [selectedNetwork, setSelectedNetwork] = useState<
    ReseauDeChaleur | ReseauDeFroid | ReseauEnConstruction | PerimetreDeDeveloppementPrioritaire | null
  >(null);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [updatedGeom, setUpdatedGeom] = useState<any>(null);
  const [networkToDelete, setNetworkToDelete] = useState<NetworkToDelete | null>(null);
  const [isPollingJobs, setIsPollingJobs] = useState(true);

  const {
    data: reseauxDeChaleur,
    isFetching: isFetchingReseauxDeChaleur,
    isLoading: isLoadingReseauxDeChaleur,
  } = trpc.reseaux.reseauDeChaleur.list.useQuery();

  const {
    data: reseauxDeFroid,
    isFetching: isFetchingReseauxDeFroid,
    isLoading: isLoadingReseauxDeFroid,
  } = trpc.reseaux.reseauDeFroid.list.useQuery();

  const {
    data: reseauxEnConstruction,
    isFetching: isFetchingReseauxEnConstruction,
    isLoading: isLoadingReseauxEnConstruction,
  } = trpc.reseaux.reseauEnConstruction.list.useQuery();

  const {
    data: perimetresDeDeveloppementPrioritaire,
    isFetching: isFetchingPerimetresDeDeveloppementPrioritaire,
    isLoading: isLoadingPerimetresDeDeveloppementPrioritaire,
  } = trpc.reseaux.perimetreDeDeveloppementPrioritaire.list.useQuery();

  const { data: pendingJobsData, isFetching: isFetchingPendingJobs } = trpc.jobs.list.useQuery(
    {
      limit: 100,
      statuses: ['pending', 'processing'],
      types: ['build_tiles', 'sync_geometries_to_airtable', 'sync_metadata_from_airtable'],
    },
    {
      refetchInterval: isPollingJobs ? 5000 : false,
    }
  );

  const pendingJobs = pendingJobsData?.jobs || [];
  useEffect(() => {
    if (isPollingJobs && !isFetchingPendingJobs && pendingJobs.length === 0) {
      setIsPollingJobs(false);
      void Promise.all(Object.values(tabsInfo).map((tabInfo) => tabInfo.refetch()));
    }
  }, [isPollingJobs, pendingJobs.length, isFetchingPendingJobs]);

  const pendingReseauDeChaleurJobs = [];
  const pendingReseauDeFroidJobs = [];
  const pendingReseauEnConstructionJobs = [];
  const pendingPerimetreJobs = [];
  const pendingSyncMetadataJobs = [];
  const pendingSyncGeometriesJobs = [];
  const pendingBuildTilesJobs = [];

  for (const job of pendingJobs) {
    const jobDataName = (job as any).data?.name as string;
    if (jobDataName === 'reseaux-de-chaleur') {
      pendingReseauDeChaleurJobs.push(job);
    } else if (jobDataName === 'reseaux-de-froid') {
      pendingReseauDeFroidJobs.push(job);
    } else if (jobDataName === 'reseaux-en-construction') {
      pendingReseauEnConstructionJobs.push(job);
    } else if (jobDataName === 'perimetres-de-developpement-prioritaire') {
      pendingPerimetreJobs.push(job);
    }

    if (job.type === 'sync_metadata_from_airtable') {
      pendingSyncMetadataJobs.push(job);
    } else if (job.type === 'sync_geometries_to_airtable') {
      pendingSyncGeometriesJobs.push(job);
    } else if (job.type === 'build_tiles') {
      pendingBuildTilesJobs.push(job);
    }
  }

  const hasPendingReseauDeChaleurJobs = pendingReseauDeChaleurJobs.length > 0;
  const hasPendingReseauDeFroidJobs = pendingReseauDeFroidJobs.length > 0;
  const hasPendingReseauEnConstructionJobs = pendingReseauEnConstructionJobs.length > 0;
  const hasPendingPerimetreJobs = pendingPerimetreJobs.length > 0;
  const hasPendingSyncMetadataJobs = pendingSyncMetadataJobs.length > 0;
  const hasPendingSyncGeometriesJobs = pendingSyncGeometriesJobs.length > 0;
  const hasPendingBuildTilesJobs = pendingBuildTilesJobs.length > 0;

  const onTableRowClick = useCallback(
    (idFCU: number) => {
      setSelectedNetwork(
        (selectedTab === 'reseaux-de-chaleur'
          ? reseauxDeChaleur
          : selectedTab === 'reseaux-de-froid'
            ? reseauxDeFroid
            : selectedTab === 'reseaux-en-construction'
              ? reseauxEnConstruction
              : perimetresDeDeveloppementPrioritaire
        )?.find((reseau) => reseau.id_fcu === idFCU) ?? null
      );
      setEditingId(null);
      setUpdatedGeom(null);
    },
    [reseauxDeChaleur, reseauxDeFroid, reseauxEnConstruction, perimetresDeDeveloppementPrioritaire, selectedTab]
  );
  const trpcUtils = trpc.useUtils();

  const tabsInfo: Record<
    typeof selectedTab,
    {
      title: string;
      type: 'reseaux_de_chaleur' | 'reseaux_de_froid' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire';
      refetch: () => void;
    }
  > = {
    'perimetres-de-developpement-prioritaire': {
      refetch: () => void trpcUtils.reseaux.perimetreDeDeveloppementPrioritaire.list.invalidate(),
      title: 'Périmètres de développement prioritaire',
      type: 'zone_de_developpement_prioritaire',
    },
    'reseaux-de-chaleur': {
      refetch: () => void trpcUtils.reseaux.reseauDeChaleur.list.invalidate(),
      title: 'Réseaux de chaleur',
      type: 'reseaux_de_chaleur',
    },
    'reseaux-de-froid': {
      refetch: () => void trpcUtils.reseaux.reseauDeFroid.list.invalidate(),
      title: 'Réseaux de froid',
      type: 'reseaux_de_froid',
    },
    'reseaux-en-construction': {
      refetch: () => void trpcUtils.reseaux.reseauEnConstruction.list.invalidate(),
      title: 'Réseaux en construction',
      type: 'zones_et_reseaux_en_construction',
    },
  };

  const tabInfo = tabsInfo[selectedTab];

  const { mutateAsync: createReminder } = trpc.reseaux.networkReminders.create.useMutation({
    onError: (error) => notify('error', `Erreur lors de l'enregistrement de la relance : ${error.message}`),
    onSuccess: () => {
      void tabInfo.refetch();
      notify('success', 'Relance enregistrée');
    },
  });

  const { mutateAsync: updateReminder } = trpc.reseaux.networkReminders.update.useMutation({
    onError: (error) => notify('error', `Erreur lors de la mise à jour de la relance : ${error.message}`),
    onSuccess: () => {
      void tabInfo.refetch();
      notify('success', 'Relance mise à jour');
    },
  });

  const { mutateAsync: deleteReminder } = trpc.reseaux.networkReminders.delete.useMutation({
    onError: (error) => notify('error', `Erreur lors de la suppression de la relance : ${error.message}`),
    onSuccess: () => {
      void tabInfo.refetch();
      notify('success', 'Relance supprimée');
    },
  });

  const { mutateAsync: updateNotes } = trpc.reseaux.networkReminders.updateNotes.useMutation({
    onError: (error) => notify('error', `Erreur lors de la mise à jour des notes : ${error.message}`),
    onSuccess: () => void tabInfo.refetch(),
  });

  const { mutateAsync: updateReseauDeChaleur } = trpc.reseaux.reseauDeChaleur.updateTags.useMutation({
    onSuccess: () => void tabInfo.refetch(),
  });

  const handleUpdateReseauDeChaleur = useCallback(
    toastErrors(async (reseauId: number, reseauUpdate: Partial<ReseauDeChaleur>) => {
      if (reseauUpdate.tags) {
        await updateReseauDeChaleur({ id: reseauId, tags: reseauUpdate.tags });
      }
    }),
    []
  );

  const { mutateAsync: updateReseauEnConstruction } = trpc.reseaux.reseauEnConstruction.updateTags.useMutation({
    onSuccess: () => void tabInfo.refetch(),
  });

  const { mutateAsync: applyGeometriesUpdates, isPending: isApplyingGeometriesUpdates } = trpc.reseaux.applyGeometriesUpdates.useMutation({
    onSuccess: async (result) => {
      try {
        notify('success', `Synchronisation lancée. ${result.jobIds.length} jobs créés.`);
        await trpcUtils.jobs.list.invalidate();
        setIsPollingJobs(true);
      } catch (error) {
        notify('error', 'Erreur lors du lancement de la synchronisation');
        console.error('Erreur synchronisation:', error);
      }
    },
  });

  const handleUpdateReseauEnConstruction = useCallback(
    toastErrors(async (reseauId: number, reseauUpdate: Partial<ReseauEnConstruction>) => {
      if (reseauUpdate.tags) {
        await updateReseauEnConstruction({ id: reseauId, tags: reseauUpdate.tags });
      }
    }),
    [updateReseauEnConstruction]
  );

  const { mutateAsync: updatePerimetreDeDeveloppementPrioritaire } = trpc.reseaux.perimetreDeDeveloppementPrioritaire.update.useMutation({
    onSuccess: () => void tabInfo.refetch(),
  });

  const handleUpdatePerimetreDeDeveloppementPrioritaire = useCallback(
    toastErrors(
      async (pdpId: number, { 'Identifiant reseau': identifiantReseau, ...rest }: Partial<PerimetreDeDeveloppementPrioritaire>) => {
        await updatePerimetreDeDeveloppementPrioritaire({
          id: pdpId,
          ...rest,
          'Identifiant reseau': identifiantReseau ?? undefined, // for bypassing typescript error
        });
      }
    ),
    [updatePerimetreDeDeveloppementPrioritaire]
  );

  const { mutateAsync: updateGeomUpdate, isPending: isUpdatingGeometry } = trpc.reseaux.updateGeomUpdate.useMutation({
    onSuccess: () => {
      void tabInfo.refetch();
      handleCancelEdit();
    },
  });

  const { mutateAsync: deleteGeomUpdate, isPending: isDeletingGeomUpdate } = trpc.reseaux.deleteGeomUpdate.useMutation({
    onSuccess: () => {
      void tabInfo.refetch();
      handleCancelEdit();
    },
  });

  const { mutateAsync: deleteNetwork, isPending: isDeletingNetwork } = trpc.reseaux.deleteNetwork.useMutation({
    onSuccess: () => {
      void tabInfo.refetch();
      handleCancelEdit();
    },
  });

  const { mutateAsync: createNetwork, isPending: isCreatingNetwork } = trpc.reseaux.createNetwork.useMutation({
    onSuccess: () => {
      void tabInfo.refetch();
      handleCancelEdit();
    },
  });

  const handleValidateGeometry = useCallback(
    toastErrors(async () => {
      if (!editingId || !updatedGeom) {
        return;
      }

      if (!selectedNetwork) {
        await createNetwork({
          geometry: updatedGeom,
          id: editingId?.toString() || '',
          type: tabInfo.type,
        });
      } else {
        await updateGeomUpdate({
          geometry: updatedGeom,
          id: typeof editingId === 'number' ? editingId : parseInt(editingId || '0', 10),
          type: tabInfo.type,
        });
      }
    }),
    [editingId, updatedGeom, updateGeomUpdate, createNetwork, selectedNetwork, selectedTab]
  );

  const handleDeleteGeomUpdate = useCallback(
    toastErrors(async () => {
      if (!selectedNetwork) {
        return;
      }
      await deleteGeomUpdate({ id: selectedNetwork.id_fcu, type: tabInfo.type });
    }),
    [selectedNetwork, deleteGeomUpdate, selectedTab]
  );

  const handleDeleteNetwork = useCallback((id: number, type: NetworkToDelete['type'], name: string) => {
    setNetworkToDelete({ id, name, type });
  }, []);

  const handleConfirmDeleteNetwork = useCallback(
    toastErrors(async () => {
      if (!networkToDelete) {
        return;
      }
      await deleteNetwork({ id: networkToDelete.id, type: networkToDelete.type });
      setNetworkToDelete(null);
    }),
    [networkToDelete, deleteNetwork]
  );

  const handleAddNewNetwork = useCallback(() => {
    setEditingId('');
    setSelectedNetwork(null);
    setUpdatedGeom(null);
  }, [selectedTab, reseauxEnConstruction, perimetresDeDeveloppementPrioritaire]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setUpdatedGeom(null);
    setSelectedNetwork(null);
  }, []);

  const rowSelection = selectedNetwork ? { [selectedNetwork.id_fcu]: true } : {};

  const buildReminderAndNotesColumns = useCallback(
    <T extends { id_fcu: number; notes: string | null; reminders: ReseauDeChaleur['reminders'] }>(
      networkType: NetworkEntityType
    ): ColumnDef<T>[] => [
      {
        accessorFn: (row: T) => row.reminders?.[0]?.created_at ?? null,
        cell: ({ row }) => (
          <RemindersCell
            reminders={row.original.reminders}
            onCreateReminder={(note, createdAt) =>
              createReminder({ createdAt, networkId: row.original.id_fcu, networkType, note, type: 'trace' })
            }
            onUpdateReminder={(id, { note, createdAt }) => updateReminder({ createdAt, id, note })}
            onDeleteReminder={(id) => deleteReminder({ id })}
          />
        ),
        enableSorting: true,
        header: 'Relances',
        id: 'reminders',
        width: '250px',
      },
      {
        accessorKey: 'notes',
        cell: ({ row }) => (
          <NotesCell
            initialNotes={row.original.notes ?? ''}
            onSave={async (notes) => {
              await updateNotes({ networkId: row.original.id_fcu, networkType, notes: notes.trim() || null });
            }}
          />
        ),
        className: 'justify-between',
        enableSorting: false,
        header: 'Notes',
        width: '280px',
      },
    ],
    [createReminder, updateReminder, deleteReminder, updateNotes]
  );

  const reseauxDeChaleurColumns = useMemo<ColumnDef<ReseauDeChaleur>[]>(
    () => [
      {
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="small"
              priority="secondary"
              iconId="fr-icon-edit-line"
              title="Modifier la géométrie"
              // For an unknown reason, if we don't prevent the default behavior, the row click event is triggered
              // and editing is not triggered
              stopPropagation
              onClick={() => {
                setEditingId(row.original.id_fcu);
                setSelectedNetwork(row.original);
              }}
            />
            <Button
              size="small"
              priority="secondary"
              variant="destructive"
              iconId="fr-icon-delete-line"
              title="Supprimer le réseau (géométrie vide)"
              loading={isDeletingNetwork}
              disabled={row.original.geom_delete}
              stopPropagation
              onClick={() => {
                void handleDeleteNetwork(row.original.id_fcu, 'reseaux_de_chaleur', row.original.nom_reseau || `ID ${row.original.id_fcu}`);
              }}
            />
            <ModifiedIcon {...row.original} />
          </div>
        ),
        id: 'actions',
        width: '120px',
      },
      {
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorKey: 'Identifiant reseau',
        filterProps: {
          placeholder: 'Filtrer par ID SNCU',
        },
        filterType: 'Text',
        header: 'ID SNCU',
        width: '140px',
      },
      {
        accessorKey: 'nom_reseau',
        cell: ({ row }) =>
          isDefined(row.original['Identifiant reseau']) ? (
            <div>
              <Link className="" href={`/reseaux/${row.original['Identifiant reseau']}`} isExternal>
                {row.original.nom_reseau}
              </Link>
            </div>
          ) : (
            row.original.nom_reseau
          ),
        filterProps: {
          placeholder: 'Filtrer par nom',
        },
        filterType: 'Text',
        header: 'Nom',
        width: '300px',
      },
      {
        accessorKey: 'Gestionnaire',
        filterProps: {
          placeholder: 'Filtrer par gestionnaire',
        },
        filterType: 'Text',
        header: 'Gestionnaire',
        width: '150px',
      },
      {
        accessorKey: 'MO',
        filterProps: {
          placeholder: "Filtrer par maître d'ouvrage",
        },
        filterType: 'Text',
        header: "Maître d'ouvrage",
        width: '150px',
      },
      {
        accessorFn: (row) => row.communes?.join(', '),
        filterProps: {
          placeholder: 'Filtrer par commune',
        },
        filterType: 'Text',
        header: 'Communes',
        width: '200px',
      },
      {
        accessorKey: `date_actualisation_trace`,
        cellType: 'Date',
        filterType: 'Range',
        header: `Date d'actualisation`,
        width: '150px',
      },
      {
        accessorKey: 'has_trace',
        cell: ({ row }) => (
          <Checkbox
            label=""
            small
            nativeInputProps={{
              checked: row.original.has_trace,
              disabled: true,
              name: 'has_trace',
            }}
          />
        ),
        filterType: 'Facets',
        header: 'Tracé',
        width: '120px',
      },
      {
        accessorKey: 'reseaux classes',
        cell: ({ row }) => (
          <Checkbox
            label=""
            small
            nativeInputProps={{
              checked: row.original['reseaux classes'] ?? false,
              disabled: true,
              name: 'reseaux_classes',
            }}
          />
        ),
        filterType: 'Facets',
        header: 'Classés',
        width: '120px',
      },
      {
        accessorKey: 'has_PDP',
        cell: ({ row }) => (
          <Checkbox
            label=""
            small
            nativeInputProps={{
              checked: row.original.has_PDP,
              disabled: true,
              name: 'has_PDP',
            }}
          />
        ),
        filterType: 'Facets',
        header: 'PDP',
        width: '120px',
      },
      {
        accessorKey: `puissance_totale_MW`,
        filterType: 'Range',
        header: `Puissance totale (MW)`,
        width: '150px',
      },
      {
        accessorKey: 'ouvert_aux_raccordements',
        cell: ({ row }) => (
          <Checkbox
            label=""
            small
            nativeInputProps={{
              checked: row.original.ouvert_aux_raccordements,
              disabled: true,
              name: 'ouvert_aux_raccordements',
            }}
          />
        ),
        filterType: 'Facets',
        header: 'Ouvert aux raccordements',
        width: '120px',
      },
      {
        accessorFn: (row) => row.tags?.join(', '),
        cell: (info) => (
          <div className="block">
            <FCUTagAutocomplete
              value={info.row.original.tags ?? []}
              onChange={(tags: string[] /* TODO should be handled by typescript */) =>
                void handleUpdateReseauDeChaleur(info.row.original.id_fcu, { tags })
              }
              multiple
              disabled
            />
          </div>
        ),
        enableSorting: false,
        header: 'Tags (obsolète)',
        width: '400px',
      },
      ...buildReminderAndNotesColumns<ReseauDeChaleur>('reseau_de_chaleur'),
    ],
    [updateReseauDeChaleur, buildReminderAndNotesColumns]
  );

  const reseauxDeFroidColumns = useMemo<ColumnDef<ReseauDeFroid>[]>(
    () => [
      {
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="small"
              priority="secondary"
              iconId="fr-icon-edit-line"
              title="Modifier la géométrie"
              stopPropagation
              onClick={() => {
                setEditingId(row.original.id_fcu);
                setSelectedNetwork(row.original);
              }}
            />
            <Button
              size="small"
              priority="secondary"
              variant="destructive"
              iconId="fr-icon-delete-line"
              title="Supprimer le réseau (géométrie vide)"
              loading={isDeletingNetwork}
              disabled={row.original.geom_delete}
              stopPropagation
              onClick={() => {
                void handleDeleteNetwork(row.original.id_fcu, 'reseaux_de_froid', row.original.nom_reseau || `ID ${row.original.id_fcu}`);
              }}
            />
            <ModifiedIcon {...row.original} />
          </div>
        ),
        id: 'actions',
        width: '120px',
      },
      {
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorKey: 'Identifiant reseau',
        filterProps: {
          placeholder: 'Filtrer par ID SNCU',
        },
        filterType: 'Text',
        header: 'ID SNCU',
        width: '140px',
      },
      {
        accessorKey: 'nom_reseau',
        cell: ({ row }) =>
          isDefined(row.original['Identifiant reseau']) ? (
            <div>
              <Link className="" href={`/reseaux/${row.original['Identifiant reseau']}`} isExternal>
                {row.original.nom_reseau}
              </Link>
            </div>
          ) : (
            row.original.nom_reseau
          ),
        filterProps: {
          placeholder: 'Filtrer par nom',
        },
        filterType: 'Text',
        header: 'Nom',
        width: '300px',
      },
      {
        accessorKey: 'Gestionnaire',
        filterProps: {
          placeholder: 'Filtrer par gestionnaire',
        },
        filterType: 'Text',
        header: 'Gestionnaire',
        width: '150px',
      },
      {
        accessorKey: 'MO',
        filterProps: {
          placeholder: "Filtrer par maître d'ouvrage",
        },
        filterType: 'Text',
        header: "Maître d'ouvrage",
        width: '150px',
      },
      {
        accessorFn: (row) => row.communes?.join(', '),
        filterProps: {
          placeholder: 'Filtrer par commune',
        },
        filterType: 'Text',
        header: 'Communes',
        width: '200px',
      },
      {
        accessorKey: 'has_trace',
        cell: ({ row }) => (
          <Checkbox
            label=""
            small
            nativeInputProps={{
              checked: row.original.has_trace,
              disabled: true,
              name: 'has_trace',
            }}
          />
        ),
        filterType: 'Facets',
        header: 'Tracé',
        width: '120px',
      },
      {
        accessorKey: `date_actualisation_trace`,
        cellType: 'Date',
        filterType: 'Range',
        header: `Date d'actualisation`,
        width: '150px',
      },
      {
        accessorKey: `puissance_totale_MW`,
        filterType: 'Range',
        header: `Puissance totale (MW)`,
        width: '150px',
      },
      ...buildReminderAndNotesColumns<ReseauDeFroid>('reseau_de_froid'),
    ],
    [buildReminderAndNotesColumns]
  );

  const reseauxEnConstructionColumns = useMemo<ColumnDef<ReseauEnConstruction>[]>(
    () => [
      {
        cell: ({ row }) => (
          <div className="flex gap-2 items-center">
            <Button
              size="small"
              priority="secondary"
              iconId="fr-icon-edit-line"
              title="Modifier la géométrie"
              stopPropagation
              onClick={() => {
                setEditingId(row.original.id_fcu);
                setSelectedNetwork(row.original);
              }}
            />
            <Button
              size="small"
              priority="secondary"
              variant="destructive"
              iconId="fr-icon-delete-line"
              title="Supprimer le réseau (géométrie vide)"
              loading={isDeletingNetwork}
              disabled={row.original.geom_delete}
              stopPropagation
              onClick={() => {
                void handleDeleteNetwork(
                  row.original.id_fcu,
                  'zones_et_reseaux_en_construction',
                  row.original.nom_reseau || `ID ${row.original.id_fcu}`
                );
              }}
            />
            <ModifiedIcon {...row.original} />
          </div>
        ),
        id: 'actions',
        width: '120px',
      },
      {
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorKey: 'nom_reseau',
        filterProps: {
          placeholder: 'Filtrer par nom',
        },
        filterType: 'Text',
        header: 'Nom',
        width: '300px',
      },
      {
        accessorKey: 'gestionnaire',
        filterProps: {
          placeholder: 'Filtrer par gestionnaire',
        },
        filterType: 'Text',
        header: 'Gestionnaire',
        width: '150px',
      },
      {
        accessorFn: (row) => row.communes?.join(', '),
        filterProps: {
          placeholder: 'Filtrer par commune',
        },
        filterType: 'Text',
        header: 'Communes',
        width: '200px',
      },
      {
        accessorKey: 'ouvert_aux_raccordements',
        cell: ({ row }) => (
          <Checkbox
            label=""
            small
            nativeInputProps={{
              checked: row.original.ouvert_aux_raccordements,
              disabled: true,
              name: 'ouvert_aux_raccordements',
            }}
          />
        ),
        filterType: 'Facets',
        header: 'Ouvert aux raccordements',
        width: '120px',
      },
      {
        accessorKey: `date_actualisation_trace`,
        cellType: 'Date',
        filterType: 'Range',
        header: `Date d'actualisation`,
        width: '150px',
      },
      {
        accessorFn: (row) => row.tags?.join(', '),
        cell: (info) => (
          <div className="block">
            <FCUTagAutocomplete
              value={info.row.original.tags ?? []}
              onChange={(tags: string[] /* TODO should be handled by typescript */) =>
                void handleUpdateReseauEnConstruction(info.row.original.id_fcu, { tags })
              }
              multiple
              disabled
            />
          </div>
        ),
        enableSorting: false,
        header: 'Tags (obsolète)',
        width: '400px',
      },
      ...buildReminderAndNotesColumns<ReseauEnConstruction>('reseau_en_construction'),
    ],
    [handleUpdateReseauEnConstruction, buildReminderAndNotesColumns]
  );

  const perimetresDeDeveloppementPrioritaireColumns = useMemo<ColumnDef<PerimetreDeDeveloppementPrioritaire>[]>(
    () => [
      {
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="small"
              priority="secondary"
              iconId="fr-icon-edit-line"
              title="Modifier la géométrie"
              stopPropagation
              onClick={() => {
                setEditingId(row.original.id_fcu);
                setSelectedNetwork(row.original);
              }}
            />
            <Button
              size="small"
              priority="secondary"
              variant="destructive"
              iconId="fr-icon-delete-line"
              title="Supprimer le périmètre (géométrie vide)"
              loading={isDeletingNetwork}
              disabled={row.original.geom_delete}
              stopPropagation
              onClick={() => {
                void handleDeleteNetwork(row.original.id_fcu, 'zone_de_developpement_prioritaire', `ID ${row.original.id_fcu}`);
              }}
            />
            <ModifiedIcon {...row.original} />
          </div>
        ),
        id: 'actions',
        width: '120px',
      },
      {
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorFn: (row) => row.communes?.join(', '),
        filterProps: {
          placeholder: 'Filtrer par commune',
        },
        filterType: 'Text',
        header: 'Communes',
        width: '300px',
      },
      {
        accessorKey: 'Identifiant reseau',
        cell: (info) => {
          const network = info.row.original;
          return (
            <TableFieldInput
              title="ID SNCU"
              value={network['Identifiant reseau']}
              onChange={(value) =>
                void handleUpdatePerimetreDeDeveloppementPrioritaire(network.id_fcu, {
                  'Identifiant reseau': value ?? undefined,
                })
              }
            />
          );
        },
        header: 'ID SNCU',
        width: '100px',
      },
      {
        accessorKey: 'reseau_de_chaleur_ids',
        cell: (info) => {
          const network = info.row.original;
          return (
            <TableFieldInput
              title="IDs Réseaux de chaleur"
              value={network.reseau_de_chaleur_ids.join(',')}
              onChange={(value) =>
                void handleUpdatePerimetreDeDeveloppementPrioritaire(network.id_fcu, {
                  reseau_de_chaleur_ids: value ? value.split(',').map(Number) : [],
                })
              }
            />
          );
        },
        header: 'IDs Réseaux de chaleur',
        width: '140px',
      },
      {
        accessorKey: 'reseau_en_construction_ids',
        cell: (info) => {
          const network = info.row.original;
          return (
            <TableFieldInput
              title="IDs Réseaux en construction"
              value={network.reseau_en_construction_ids.join(',')}
              onChange={(value) =>
                void handleUpdatePerimetreDeDeveloppementPrioritaire(network.id_fcu, {
                  reseau_en_construction_ids: value ? value.split(',').map(Number) : [],
                })
              }
            />
          );
        },
        header: 'IDs Réseaux en construction',
        width: '140px',
      },
      ...buildReminderAndNotesColumns<PerimetreDeDeveloppementPrioritaire>('perimetre_de_developpement_prioritaire'),
    ],
    [handleUpdatePerimetreDeDeveloppementPrioritaire, buildReminderAndNotesColumns]
  );

  const reseauxDeChaleurWithGeomUpdate = reseauxDeChaleur?.filter((reseau) => reseau.geom_update);
  const reseauxDeFroidWithGeomUpdate = reseauxDeFroid?.filter((reseau) => reseau.geom_update);
  const reseauxEnConstructionWithGeomUpdate = reseauxEnConstruction?.filter((reseau) => reseau.geom_update);
  const perimetresDeDeveloppementPrioritaireWithGeomUpdate = perimetresDeDeveloppementPrioritaire?.filter((pdp) => pdp.geom_update);

  const totalGeomUpdates =
    (reseauxDeChaleurWithGeomUpdate?.length ?? 0) +
    (reseauxDeFroidWithGeomUpdate?.length ?? 0) +
    (reseauxEnConstructionWithGeomUpdate?.length ?? 0) +
    (perimetresDeDeveloppementPrioritaireWithGeomUpdate?.length ?? 0);

  const handleSyncGeomUpdates = toastErrors(
    async (name: 'reseaux-de-chaleur' | 'reseaux-de-froid' | 'reseaux-en-construction' | 'perimetres-de-developpement-prioritaire') => {
      await applyGeometriesUpdates({ name });
    }
  );

  // Prepare geomUpdate features for the map
  const geomUpdateFeatures: GeoJSON.Feature[] = useMemo(() => {
    return [
      ...(reseauxDeChaleurWithGeomUpdate
        ?.filter((reseau) => reseau.geom_update)
        .map((reseau) => ({
          geometry: reseau.geom_update,
          id: `${reseau.id_fcu}-reseau-de-chaleur`,
          properties: {
            ...(reseau.geom_update.properties || {}),
            id_fcu: reseau.id_fcu,
            nom_reseau: reseau.nom_reseau,
            type: 'reseau_de_chaleur',
          },
          type: 'Feature' as const,
        })) ?? []),
      ...(reseauxDeFroidWithGeomUpdate
        ?.filter((reseau) => reseau.geom_update)
        .map((reseau) => ({
          geometry: reseau.geom_update,
          id: `${reseau.id_fcu}-reseau-de-froid`,
          properties: {
            ...(reseau.geom_update.properties || {}),
            id_fcu: reseau.id_fcu,
            nom_reseau: reseau.nom_reseau,
            type: 'reseau_de_froid',
          },
          type: 'Feature' as const,
        })) ?? []),
      ...(reseauxEnConstructionWithGeomUpdate
        ?.filter((reseau) => reseau.geom_update)
        .map((reseau) => ({
          geometry: reseau.geom_update,
          id: `${reseau.id_fcu}-reseau-en-construction`,
          properties: {
            ...(reseau.geom_update.properties || {}),
            id_fcu: reseau.id_fcu,
            nom_reseau: reseau.nom_reseau,
            type: 'reseau_en_construction',
          },
          type: 'Feature' as const,
        })) ?? []),
      ...(perimetresDeDeveloppementPrioritaireWithGeomUpdate
        ?.filter((pdp) => pdp.geom_update)
        .map((pdp) => ({
          geometry: pdp.geom_update,
          id: `${pdp.id_fcu}-perimetre-de-developpement-prioritaire`,
          properties: {
            ...(pdp.geom_update.properties || {}),
            id_fcu: pdp.id_fcu,
            type: 'perimetres_de_developpement_prioritaire',
          },
          type: 'Feature' as const,
        })) ?? []),
    ];
  }, [
    reseauxDeChaleurWithGeomUpdate,
    reseauxDeFroidWithGeomUpdate,
    reseauxEnConstructionWithGeomUpdate,
    perimetresDeDeveloppementPrioritaireWithGeomUpdate,
  ]);

  const networkMarkedForDeletion = selectedNetwork?.geom_delete;

  const hasPendingGeomUpdates = totalGeomUpdates > 0 && (!pendingJobs || pendingJobs.length === 0);
  const hasPendingJobs = pendingJobs && pendingJobs.length > 0;

  // +/- approximatif, et pas responsive
  const navHeaderSize = 56;
  const noticeSize = 56;
  const contentVerticalMargin = 32;

  const tableVerticalMargin = 32;
  const tableTabsSize = 48;
  const tableFilterHeaderSize = 64;
  const tableHeight = `calc(100dvh - ${navHeaderSize + contentVerticalMargin + (hasPendingGeomUpdates ? noticeSize : 0) + (hasPendingJobs ? noticeSize : 0) + tableTabsSize + tableVerticalMargin + tableFilterHeaderSize}px)`;

  const mapContainerHeight = `${navHeaderSize + contentVerticalMargin + (hasPendingGeomUpdates ? noticeSize : 0) + (hasPendingJobs ? noticeSize : 0)}px`;

  const tabs = [
    {
      content: (
        <TableSimple
          columns={reseauxDeChaleurColumns}
          data={reseauxDeChaleur ?? []}
          loading={isLoadingReseauxDeChaleur}
          fluid
          controlsLayout="block"
          padding="sm"
          loadingEmptyMessage="Aucun réseau de chaleur à afficher"
          height={tableHeight}
          onRowClick={onTableRowClick}
          rowIdKey="id_fcu"
          enableGlobalFilter
          rowSelection={selectedTab === 'reseaux-de-chaleur' ? rowSelection : {}}
          topRightActions={
            <div className="flex gap-2">
              <Button
                size="small"
                priority="primary"
                variant="warning"
                disabled={hasPendingReseauDeChaleurJobs || isFetchingPendingJobs}
                iconId="fr-icon-refresh-line"
                onClick={() => handleSyncGeomUpdates('reseaux-de-chaleur')}
                loading={isUpdatingGeometry || hasPendingReseauDeChaleurJobs || isApplyingGeometriesUpdates}
              >
                Sync ({reseauxDeChaleurWithGeomUpdate?.length})
              </Button>
              <Button size="small" priority="secondary" iconId="fr-icon-add-line" onClick={handleAddNewNetwork}>
                Ajouter un réseau
              </Button>
            </div>
          }
        />
      ),
      isDefault: selectedTab === 'reseaux-de-chaleur',
      label: (
        <>
          Réseaux de chaleur
          <Tag size="sm" className="ml-2">
            {(reseauxDeChaleurWithGeomUpdate || []).length > 0 && <Icon name="fr-icon-warning-line" size="sm" color="warning" />}
            {isFetchingReseauxDeChaleur ? <Loader size="sm" className="mx-1" /> : (reseauxDeChaleur?.length ?? 0)}
          </Tag>
        </>
      ),
    },
    {
      content: (
        <TableSimple
          columns={reseauxDeFroidColumns}
          data={reseauxDeFroid ?? []}
          loading={isLoadingReseauxDeFroid}
          fluid
          controlsLayout="block"
          padding="sm"
          loadingEmptyMessage="Aucun réseau de froid à afficher"
          height={tableHeight}
          onRowClick={onTableRowClick}
          rowIdKey="id_fcu"
          enableGlobalFilter
          rowSelection={selectedTab === 'reseaux-de-froid' ? rowSelection : {}}
          topRightActions={
            <div className="flex gap-2">
              <Button
                size="small"
                priority="primary"
                variant="warning"
                disabled={hasPendingReseauDeFroidJobs || isFetchingPendingJobs}
                iconId="fr-icon-refresh-line"
                onClick={() => handleSyncGeomUpdates('reseaux-de-froid')}
                loading={isUpdatingGeometry || hasPendingReseauDeFroidJobs || isApplyingGeometriesUpdates}
              >
                Sync ({reseauxDeFroidWithGeomUpdate?.length})
              </Button>
              <Button size="small" priority="secondary" iconId="fr-icon-add-line" onClick={handleAddNewNetwork}>
                Ajouter un réseau
              </Button>
            </div>
          }
        />
      ),
      isDefault: selectedTab === 'reseaux-de-froid',
      label: (
        <>
          Réseaux de froid
          <Tag size="sm" className="ml-2">
            {(reseauxDeFroidWithGeomUpdate || []).length > 0 && <Icon name="fr-icon-warning-line" size="sm" color="warning" />}
            {isFetchingReseauxDeFroid ? <Loader size="sm" className="mx-1" /> : (reseauxDeFroid?.length ?? 0)}
          </Tag>
        </>
      ),
    },
    {
      content: (
        <TableSimple
          columns={reseauxEnConstructionColumns}
          data={reseauxEnConstruction ?? []}
          loading={isLoadingReseauxEnConstruction}
          fluid
          controlsLayout="block"
          padding="sm"
          loadingEmptyMessage="Aucun réseau en construction à afficher"
          height={tableHeight}
          onRowClick={onTableRowClick}
          rowIdKey="id_fcu"
          enableGlobalFilter
          rowSelection={selectedTab === 'reseaux-en-construction' ? rowSelection : {}}
          topRightActions={
            <div className="flex gap-2">
              <Button
                size="small"
                priority="primary"
                variant="warning"
                iconId="fr-icon-refresh-line"
                onClick={() => handleSyncGeomUpdates('reseaux-en-construction')}
                loading={isUpdatingGeometry || hasPendingReseauEnConstructionJobs || isApplyingGeometriesUpdates}
              >
                Sync ({reseauxEnConstructionWithGeomUpdate?.length})
              </Button>
              <Button size="small" priority="secondary" iconId="fr-icon-add-line" onClick={handleAddNewNetwork}>
                Ajouter un réseau
              </Button>
            </div>
          }
        />
      ),
      isDefault: selectedTab === 'reseaux-en-construction',
      label: (
        <>
          Réseaux en construction
          <Tag size="sm" className="ml-2">
            {(reseauxEnConstructionWithGeomUpdate || []).length > 0 && <Icon name="fr-icon-warning-line" size="sm" color="warning" />}
            {isFetchingReseauxEnConstruction ? <Loader size="sm" className="mx-1" /> : (reseauxEnConstruction?.length ?? 0)}
          </Tag>
        </>
      ),
    },
    {
      content: (
        <TableSimple
          columns={perimetresDeDeveloppementPrioritaireColumns}
          data={perimetresDeDeveloppementPrioritaire ?? []}
          loading={isLoadingPerimetresDeDeveloppementPrioritaire}
          fluid
          controlsLayout="block"
          padding="sm"
          loadingEmptyMessage="Aucun périmètre de développement prioritaire à afficher"
          height={tableHeight}
          onRowClick={onTableRowClick}
          rowIdKey="id_fcu"
          enableGlobalFilter
          rowSelection={selectedTab === 'perimetres-de-developpement-prioritaire' ? rowSelection : {}}
          topRightActions={
            <div className="flex gap-2">
              <Button
                size="small"
                priority="primary"
                variant="warning"
                iconId="fr-icon-refresh-line"
                onClick={() => handleSyncGeomUpdates('perimetres-de-developpement-prioritaire')}
                loading={isUpdatingGeometry || hasPendingPerimetreJobs}
              >
                Sync ({perimetresDeDeveloppementPrioritaireWithGeomUpdate?.length})
              </Button>
              <Button size="small" priority="secondary" iconId="fr-icon-add-line" onClick={handleAddNewNetwork}>
                Ajouter un périmètre
              </Button>
            </div>
          }
        />
      ),
      isDefault: selectedTab === 'perimetres-de-developpement-prioritaire',
      label: (
        <>
          Périmètres de développement prioritaire
          <Tag size="sm" className="ml-2">
            {(perimetresDeDeveloppementPrioritaireWithGeomUpdate || []).length > 0 && (
              <Icon name="fr-icon-warning-line" size="sm" color="warning" />
            )}
            {isFetchingPerimetresDeDeveloppementPrioritaire ? (
              <Loader size="sm" className="mx-1" />
            ) : (
              (perimetresDeDeveloppementPrioritaire?.length ?? 0)
            )}
          </Tag>
        </>
      ),
    },
  ];

  return (
    <SimplePage
      title="Gestion des réseaux"
      description="Tableau d'administration pour gérer les réseaux de chaleur et en construction"
      mode="authenticated"
    >
      {hasPendingGeomUpdates && (
        <Notice variant="warning" className="mb-4">
          <span className="flex items-center justify-center w-full gap-2">
            <span className="font-medium text-base">
              {totalGeomUpdates} modification{totalGeomUpdates > 1 ? 's' : ''} de géométrie en attente
            </span>
            <span className="text-sm text-gray-700 font-normal">
              <strong>({reseauxDeChaleurWithGeomUpdate?.length ?? 0}</strong> réseaux de chaleur,{' '}
              <strong>{reseauxDeFroidWithGeomUpdate?.length ?? 0}</strong> réseaux de froid,{' '}
              <strong>{reseauxEnConstructionWithGeomUpdate?.length ?? 0}</strong> réseaux en construction,{' '}
              <strong>{perimetresDeDeveloppementPrioritaireWithGeomUpdate?.length ?? 0}</strong> périmètres)
            </span>
          </span>
        </Notice>
      )}
      {hasPendingJobs && (
        <Notice variant="info" className="mb-4">
          <span className="flex items-center justify-center w-full gap-2">
            {isPollingJobs && <Loader size="sm" />}
            <span className="font-medium text-base">
              {pendingJobs.length} job{pendingJobs.length > 1 ? 's' : ''} en cours d'exécution
            </span>
            <span className="text-sm text-gray-700 font-normal">
              {[
                hasPendingSyncMetadataJobs && `${pendingSyncMetadataJobs.length} sync métadonnées`,
                hasPendingBuildTilesJobs &&
                  `${pendingBuildTilesJobs.length} génération${pendingBuildTilesJobs.length > 1 ? 's' : ''} de tuiles`,
                hasPendingSyncGeometriesJobs && `${pendingSyncGeometriesJobs.length} sync géométries`,
              ]
                .filter(Boolean)
                .join(', ')}
            </span>
          </span>
        </Notice>
      )}
      <div className="my-8">
        <ResizablePanelGroup orientation="horizontal" className="gap-4">
          <ResizablePanel defaultSize="66%">
            <Tabs
              classes={{ panel: 'p-4' }}
              tabs={tabs}
              onTabChange={(event) => {
                const newTab = tabIds[event.tabIndex];
                void setSelectedTab(newTab);
                handleCancelEdit();
              }}
            />
          </ResizablePanel>
          <ResizableSeparator />
          <ResizablePanel defaultSize="34%">
            <div
              className={cx('max-md:h-[700px] md:h-[calc(100dvh-var(--height))] bg-[#F8F4F0]')}
              style={{ '--height': mapContainerHeight } as any}
            >
              <Map
                config={createMapConfiguration({
                  customGeojson: true,
                  demandesEligibilite: true,
                  geomUpdate: true,
                  reseauxDeChaleur: { show: true },
                  reseauxDeFroid: true,
                  reseauxEnConstruction: true,
                  zonesDeDeveloppementPrioritaire: true,
                })}
                legend="hidden"
                search={editingId !== null ? 'none' : 'network'}
              >
                <FileDropHandler onDrop={setUpdatedGeom} />
                <GeomUpdateLayerData features={geomUpdateFeatures} />
                <MapFitBounds bbox={selectedNetwork?.bbox as [number, number, number, number] | undefined} duration={1200} maxZoom={16} />
                {editingId !== null && (
                  <div className="absolute top-2 left-12 max-w-md z-10 bg-white shadow rounded overflow-y-auto p-2">
                    {networkMarkedForDeletion ? (
                      <>
                        <div className="text-center text-sm mt-2">
                          Suppression du tracé de{' '}
                          <strong>
                            {(selectedNetwork as ReseauDeChaleur | ReseauDeFroid | ReseauEnConstruction)?.nom_reseau ||
                              selectedNetwork?.id_fcu}
                          </strong>
                        </div>
                        <Notice variant="warning" size="sm" className="mx-2">
                          Ce réseau est marqué pour suppression. Vous pouvez annuler cette suppression.
                        </Notice>
                        <div className="flex gap-2 items-center justify-center my-2">
                          <Button
                            size="small"
                            variant="destructive"
                            priority="primary"
                            iconId="fr-icon-refresh-line"
                            title="Annuler la suppression"
                            loading={isDeletingGeomUpdate}
                            stopPropagation
                            onClick={() => {
                              void handleDeleteGeomUpdate();
                            }}
                          >
                            Annuler la suppression
                          </Button>
                          <Button
                            size="small"
                            variant="faded"
                            priority="tertiary"
                            iconId="fr-icon-close-line"
                            title="Fermer"
                            stopPropagation
                            onClick={() => {
                              handleCancelEdit();
                            }}
                          >
                            Fermer
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {!selectedNetwork ? (
                          <>
                            <div className="text-center text-sm mt-2">Création d'un nouveau {tabInfo.title}</div>
                            <div className="m-2">
                              <Input
                                label={
                                  selectedTab === 'reseaux-de-chaleur' || selectedTab === 'reseaux-de-froid'
                                    ? 'ID SNCU ou ID FCU du nouveau réseau'
                                    : 'ID du nouveau réseau'
                                }
                                nativeInputProps={{
                                  onChange: (e) => {
                                    setEditingId(e.target.value);
                                  },
                                  placeholder:
                                    selectedTab === 'reseaux-de-chaleur' || selectedTab === 'reseaux-de-froid'
                                      ? 'Ex: 7412A ou 123'
                                      : 'Ex: 123',
                                  required: true,
                                  value: editingId?.toString() || '',
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-sm mt-2">
                            Modification du tracé de{' '}
                            <strong>
                              {(selectedNetwork as ReseauDeChaleur | ReseauDeFroid | ReseauEnConstruction)?.nom_reseau ||
                                selectedNetwork?.id_fcu}
                            </strong>
                          </div>
                        )}
                        {!updatedGeom ? (
                          <Notice variant="warning" size="sm" className="mx-2">
                            Glissez et déposez le tracé sur la carte
                          </Notice>
                        ) : (
                          <Notice variant="info" size="sm" className="mx-2">
                            Tracé déposé en rouge
                          </Notice>
                        )}
                        <div className="flex gap-2 items-center justify-center my-2">
                          {selectedNetwork?.geom_update && !updatedGeom ? (
                            <Button
                              size="small"
                              variant="destructive"
                              priority="primary"
                              iconId="fr-icon-refresh-line"
                              title={!selectedNetwork?.geom_create ? 'Annuler la modification' : 'Annuler la création'}
                              loading={isDeletingGeomUpdate}
                              disabled={!selectedNetwork}
                              stopPropagation
                              onClick={() => {
                                if (selectedNetwork?.geom_create) {
                                  void handleDeleteNetwork(selectedNetwork.id_fcu, tabInfo.type, `ID ${selectedNetwork.id_fcu}`);
                                } else {
                                  void handleDeleteGeomUpdate();
                                }
                              }}
                            >
                              {!selectedNetwork?.geom_create ? 'Annuler la modification' : 'Annuler la création'}
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              priority="primary"
                              iconId="fr-icon-check-line"
                              title={!selectedNetwork ? 'Créer le réseau' : 'Valider la modification'}
                              loading={!selectedNetwork ? isCreatingNetwork : isUpdatingGeometry}
                              disabled={
                                !updatedGeom ||
                                (!selectedNetwork && !editingId) ||
                                (!selectedNetwork &&
                                  (selectedTab === 'reseaux-de-chaleur' || selectedTab === 'reseaux-de-froid') &&
                                  !editingId?.toString().trim())
                              }
                              stopPropagation
                              onClick={() => {
                                void handleValidateGeometry();
                              }}
                            >
                              {!selectedNetwork ? 'Créer le réseau' : 'Valider la modification'}
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="faded"
                            priority="tertiary"
                            iconId="fr-icon-close-line"
                            title="Annuler"
                            stopPropagation
                            onClick={() => {
                              handleCancelEdit();
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                      </>
                    )}
                    <div className="mt-2">
                      {
                        {
                          'perimetres-de-developpement-prioritaire': <PerimetresDeDeveloppementPrioritaireLegend />,
                          'reseaux-de-chaleur': <ReseauxDeChaleurLegend />,
                          'reseaux-de-froid': <ReseauxDeFroidLegend />,
                          'reseaux-en-construction': <ReseauxEnConstructionLegend />,
                        }[selectedTab]
                      }
                      <CustomGeojsonLegend />
                      <GeomUpdateLegend />
                    </div>
                  </div>
                )}
              </Map>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      <DeleteNetworkDialog network={networkToDelete} onClose={() => setNetworkToDelete(null)} onConfirm={handleConfirmDeleteNetwork} />
    </SimplePage>
  );
};

export default GestionDesReseaux;
