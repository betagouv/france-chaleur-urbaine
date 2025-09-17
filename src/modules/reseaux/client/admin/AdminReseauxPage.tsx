import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import TableFieldInput from '@/components/Admin/TableFieldInput';
import FCUTagAutocomplete from '@/components/form/FCUTagAutocomplete';
import AdminEditLegend from '@/components/Map/components/AdminEditLegend';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Notice from '@/components/ui/Notice';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { toastErrors } from '@/services/notification';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';

const tabIds = ['reseaux-de-chaleur', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire'] as const;

type ReseauDeChaleur = RouterOutput['reseaux']['list'][number];
type ReseauEnConstruction = RouterOutput['reseaux']['listEnConstruction'][number];
type PerimetreDeDeveloppementPrioritaire = RouterOutput['reseaux']['listPerimetresDeDeveloppementPrioritaire'][number];

const ModifiedIcon = <T extends Record<string, any>>(record: T & { geom_delete: boolean; geom_update: any }) => {
  if (!record.geom_update && !record.geom_delete) {
    return null;
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

const GestionDesReseaux = () => {
  const [selectedTab, setSelectedTab] = useQueryState('tab', parseAsStringLiteral(tabIds).withDefault('reseaux-de-chaleur'));

  const [selectedNetwork, setSelectedNetwork] = useState<
    ReseauDeChaleur | ReseauEnConstruction | PerimetreDeDeveloppementPrioritaire | null
  >(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [updatedGeom, setUpdatedGeom] = useState<any>(null);

  const { data: reseauxDeChaleur, isLoading: isLoadingReseauxDeChaleur, refetch: refetchReseauxDeChaleur } = trpc.reseaux.list.useQuery();

  const {
    data: reseauxEnConstruction,
    isLoading: isLoadingReseauxEnConstruction,
    refetch: refetchReseauxEnConstruction,
  } = trpc.reseaux.listEnConstruction.useQuery();
  const {
    data: perimetresDeDeveloppementPrioritaire,
    isLoading: isLoadingPerimetresDeDeveloppementPrioritaire,
    refetch: refetchPerimetresDeDeveloppementPrioritaire,
  } = trpc.reseaux.listPerimetresDeDeveloppementPrioritaire.useQuery();

  // find all reseauxDeChaleur, reseauxEnConstruction, perimetresDeDeveloppementPrioritaire that avec a field geomUpdate with something in it
  const reseauxDeChaleurWithGeomUpdate = reseauxDeChaleur?.filter((reseau) => reseau.geom_update);
  const reseauxEnConstructionWithGeomUpdate = reseauxEnConstruction?.filter((reseau) => reseau.geom_update);
  const perimetresDeDeveloppementPrioritaireWithGeomUpdate = perimetresDeDeveloppementPrioritaire?.filter((pdp) => pdp.geom_update);

  const onTableRowClick = useCallback(
    (idFCU: number) => {
      setSelectedNetwork(
        (selectedTab === 'reseaux-de-chaleur'
          ? reseauxDeChaleur
          : selectedTab === 'reseaux-en-construction'
            ? reseauxEnConstruction
            : perimetresDeDeveloppementPrioritaire
        )?.find((reseau) => reseau.id_fcu === idFCU) ?? null
      );
      setUpdatedGeom(null);
      setEditingId(null);
    },
    [reseauxDeChaleur, reseauxEnConstruction, perimetresDeDeveloppementPrioritaire, selectedTab]
  );

  const { mutateAsync: updateReseauDeChaleur } = trpc.reseaux.updateTags.useMutation({
    onSuccess: () => {
      void refetchReseauxDeChaleur();
    },
  });

  const handleUpdateReseauDeChaleur = useCallback(
    toastErrors(async (reseauId: number, reseauUpdate: Partial<ReseauDeChaleur>) => {
      if (reseauUpdate.tags) {
        await updateReseauDeChaleur({ id: reseauId, tags: reseauUpdate.tags });
      }
    }),
    []
  );

  const { mutateAsync: updateReseauEnConstruction } = trpc.reseaux.updateEnConstructionTags.useMutation({
    onSuccess: () => {
      void refetchReseauxEnConstruction();
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

  const { mutateAsync: updatePerimetreDeDeveloppementPrioritaire } = trpc.reseaux.updatePerimetreDeDeveloppementPrioritaire.useMutation({
    onSuccess: () => {
      void refetchPerimetresDeDeveloppementPrioritaire();
    },
  });

  const { mutateAsync: updateGeometry, isPending: isUpdatingGeometry } = trpc.reseaux.updateGeometry.useMutation({
    onSuccess: (_, { type }) => {
      if (type === 'reseaux_de_chaleur') {
        void refetchReseauxDeChaleur();
      } else if (type === 'zones_et_reseaux_en_construction') {
        void refetchReseauxEnConstruction();
      } else if (type === 'zone_de_developpement_prioritaire') {
        void refetchPerimetresDeDeveloppementPrioritaire();
      }
      setUpdatedGeom(null);
      setEditingId(null);
    },
  });

  const { mutateAsync: deleteGeomUpdate, isPending: isDeletingGeomUpdate } = trpc.reseaux.deleteGeomUpdate.useMutation({
    onSuccess: (_, { type }) => {
      if (type === 'reseaux_de_chaleur') {
        void refetchReseauxDeChaleur();
      } else if (type === 'zones_et_reseaux_en_construction') {
        void refetchReseauxEnConstruction();
      } else if (type === 'zone_de_developpement_prioritaire') {
        void refetchPerimetresDeDeveloppementPrioritaire();
      }
      setUpdatedGeom(null);
      setEditingId(null);
    },
  });

  const { mutateAsync: deleteNetwork, isPending: isDeletingNetwork } = trpc.reseaux.deleteNetwork.useMutation({
    onSuccess: (_, { type }) => {
      if (type === 'reseaux_de_chaleur') {
        void refetchReseauxDeChaleur();
      } else if (type === 'zones_et_reseaux_en_construction') {
        void refetchReseauxEnConstruction();
      } else if (type === 'zone_de_developpement_prioritaire') {
        void refetchPerimetresDeDeveloppementPrioritaire();
      }
    },
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

  const handleValidateGeometry = useCallback(
    toastErrors(async () => {
      if (!editingId || !updatedGeom) {
        return;
      }
      await updateGeometry({
        id: editingId,
        geometry: updatedGeom,
        type:
          selectedTab === 'reseaux-de-chaleur'
            ? 'reseaux_de_chaleur'
            : selectedTab === 'reseaux-en-construction'
              ? 'zones_et_reseaux_en_construction'
              : 'zone_de_developpement_prioritaire',
      });
    }),
    [editingId, updatedGeom, updateGeometry]
  );

  const handleDeleteGeomUpdate = useCallback(
    toastErrors(async () => {
      if (!selectedNetwork) {
        return;
      }
      await deleteGeomUpdate({
        id: selectedNetwork.id_fcu,
        type:
          selectedTab === 'reseaux-de-chaleur'
            ? 'reseaux_de_chaleur'
            : selectedTab === 'reseaux-en-construction'
              ? 'zones_et_reseaux_en_construction'
              : 'zone_de_developpement_prioritaire',
      });
    }),
    [selectedNetwork, deleteGeomUpdate, selectedTab]
  );

  const handleDeleteNetwork = useCallback(
    toastErrors(async (id: number, type: string, name: string) => {
      if (
        !window.confirm(
          `Êtes-vous sûr de vouloir supprimer "${name}" ?\n\nCette action marquera le réseau comme supprimé et sera effectif à la prochaine synchronisation.`
        )
      ) {
        return;
      }

      await deleteNetwork({
        id,
        type: type as 'reseaux_de_chaleur' | 'zones_et_reseaux_en_construction' | 'zone_de_developpement_prioritaire',
      });
    }),
    [deleteNetwork]
  );

  const rowSelection = selectedNetwork ? { [selectedNetwork.id_fcu]: true } : {};

  const reseauxDeChaleurColumns = useMemo<ColumnDef<ReseauDeChaleur>[]>(
    () => [
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="small"
              priority="secondary"
              iconId="fr-icon-edit-line"
              title="Modifier le tag"
              onClick={(e) => {
                // For an unknown reason, if we don't prevent the default behavior, the row click event is triggered
                // and editing is not triggered
                e.preventDefault();
                e.stopPropagation();
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleDeleteNetwork(row.original.id_fcu, 'reseaux_de_chaleur', row.original.nom_reseau || `ID ${row.original.id_fcu}`);
              }}
            />
            <ModifiedIcon {...row.original} />
          </div>
        ),
        width: '120px',
      },
      {
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorKey: 'Identifiant reseau',
        header: 'ID SNCU',
        width: '140px',
      },
      {
        accessorKey: 'nom_reseau',
        header: 'Nom',
        width: '300px',
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
      },
      {
        accessorKey: 'Gestionnaire',
        header: 'Gestionnaire',
        width: '150px',
      },
      {
        accessorKey: 'MO',
        header: "Maître d'ouvrage",
        width: '150px',
      },
      {
        accessorFn: (row) => row.communes?.join(', '),
        header: 'Communes',
        width: '200px',
      },
      {
        accessorFn: (row) => row.tags?.join(', '),
        header: 'Tags',
        cell: (info) => (
          <div className="block">
            <FCUTagAutocomplete
              value={info.row.original.tags ?? []}
              onChange={(tags: string[] /* TODO should be handled by typescript */) =>
                void handleUpdateReseauDeChaleur(info.row.original.id_fcu, { tags })
              }
              multiple
            />
          </div>
        ),
        width: '400px',
        enableSorting: false,
      },
    ],
    [updateReseauDeChaleur]
  );

  const reseauxEnConstructionColumns = useMemo<ColumnDef<ReseauEnConstruction>[]>(
    () => [
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex gap-2 items-center">
            <Button
              size="small"
              priority="secondary"
              iconId="fr-icon-edit-line"
              title="Modifier le tag"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
        width: '120px',
      },
      {
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorKey: 'nom_reseau',
        header: 'Nom',
        width: '300px',
      },
      {
        accessorKey: 'gestionnaire',
        header: 'Gestionnaire',
        width: '150px',
      },
      {
        accessorFn: (row) => row.communes?.join(', '),
        header: 'Communes',
        width: '200px',
      },
      {
        accessorFn: (row) => row.tags?.join(', '),
        header: 'Tags',
        cell: (info) => (
          <div className="block">
            <FCUTagAutocomplete
              value={info.row.original.tags ?? []}
              onChange={(tags: string[] /* TODO should be handled by typescript */) =>
                void handleUpdateReseauEnConstruction(info.row.original.id_fcu, { tags })
              }
              multiple
            />
          </div>
        ),
        width: '400px',
        enableSorting: false,
      },
    ],
    [handleUpdateReseauEnConstruction]
  );

  const perimetresDeDeveloppementPrioritaireColumns = useMemo<ColumnDef<PerimetreDeDeveloppementPrioritaire>[]>(
    () => [
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              size="small"
              priority="secondary"
              iconId="fr-icon-edit-line"
              title="Modifier le tag"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
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
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleDeleteNetwork(row.original.id_fcu, 'zone_de_developpement_prioritaire', `ID ${row.original.id_fcu}`);
              }}
            />
            <ModifiedIcon {...row.original} />
          </div>
        ),
        width: '120px',
      },
      {
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorFn: (row) => row.communes?.join(', '),
        header: 'Communes',
        width: '300px',
      },
      {
        accessorKey: 'Identifiant reseau',
        header: 'ID SNCU',
        width: '100px',
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
      },
      {
        accessorKey: 'reseau_de_chaleur_ids',
        header: 'IDs Réseaux de chaleur',
        width: '140px',
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
      },
      {
        accessorKey: 'reseau_en_construction_ids',
        header: 'IDs Réseaux en construction',
        width: '140px',
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
      },
    ],
    [handleUpdatePerimetreDeDeveloppementPrioritaire]
  );

  const totalGeomUpdates =
    (reseauxDeChaleurWithGeomUpdate?.length ?? 0) +
    (reseauxEnConstructionWithGeomUpdate?.length ?? 0) +
    (perimetresDeDeveloppementPrioritaireWithGeomUpdate?.length ?? 0);

  const handleSyncGeomUpdates = () => {
    alert('Super, demande à Martin ou Maxime de recréer les tuiles');
  };

  // Prepare geomUpdate features for the map
  const geomUpdateFeatures: GeoJSON.Feature[] = useMemo(() => {
    return [
      ...(reseauxDeChaleurWithGeomUpdate
        ?.filter((reseau) => reseau.geom_update)
        .map((reseau) => ({
          id: `${reseau.id_fcu}-reseau-de-chaleur`,
          type: 'Feature' as const,
          geometry: reseau.geom_update,
          properties: {
            ...(reseau.geom_update.properties || {}),
            nom_reseau: reseau.nom_reseau,
            type: 'reseau_de_chaleur',
            id_fcu: reseau.id_fcu,
          },
        })) ?? []),
      ...(reseauxEnConstructionWithGeomUpdate
        ?.filter((reseau) => reseau.geom_update)
        .map((reseau) => ({
          id: `${reseau.id_fcu}-reseau-en-construction`,
          type: 'Feature' as const,
          geometry: reseau.geom_update,
          properties: {
            ...(reseau.geom_update.properties || {}),
            nom_reseau: reseau.nom_reseau,
            type: 'reseau_en_construction',
            id_fcu: reseau.id_fcu,
          },
        })) ?? []),
      ...(perimetresDeDeveloppementPrioritaireWithGeomUpdate
        ?.filter((pdp) => pdp.geom_update)
        .map((pdp) => ({
          id: `${pdp.id_fcu}-perimetre-de-developpement-prioritaire`,
          type: 'Feature' as const,
          geometry: pdp.geom_update,
          properties: {
            ...(pdp.geom_update.properties || {}),
            type: 'perimetres_de_developpement_prioritaire',
            id_fcu: pdp.id_fcu,
          },
        })) ?? []),
    ];
  }, [reseauxDeChaleurWithGeomUpdate, reseauxEnConstructionWithGeomUpdate, perimetresDeDeveloppementPrioritaireWithGeomUpdate]);

  const tabs = [
    {
      label: (
        <>
          {(reseauxDeChaleurWithGeomUpdate || []).length > 0 && <Icon name="fr-icon-warning-line" size="sm" color="warning" />}
          Réseaux de chaleur ({reseauxDeChaleur?.length ?? 0})
        </>
      ),
      content: (
        <TableSimple
          columns={reseauxDeChaleurColumns}
          data={reseauxDeChaleur ?? []}
          loading={isLoadingReseauxDeChaleur}
          fluid
          controlsLayout="block"
          padding="sm"
          loadingEmptyMessage="Aucun réseau de chaleur à afficher"
          height="calc(100dvh - 194px)"
          onRowClick={onTableRowClick}
          rowIdKey="id_fcu"
          enableGlobalFilter
          rowSelection={selectedTab === 'reseaux-de-chaleur' ? rowSelection : {}}
          topRightActions={
            (reseauxDeChaleurWithGeomUpdate || []).length > 0 ? (
              <Button size="small" priority="primary" variant="warning" iconId="fr-icon-refresh-line" onClick={handleSyncGeomUpdates}>
                Sync ({reseauxDeChaleurWithGeomUpdate?.length})
              </Button>
            ) : undefined
          }
        />
      ),
      isDefault: selectedTab === 'reseaux-de-chaleur',
    },
    {
      label: (
        <>
          {(reseauxEnConstructionWithGeomUpdate || []).length > 0 && <Icon name="fr-icon-warning-line" size="sm" color="warning" />}
          Réseaux en construction ({reseauxEnConstruction?.length ?? 0})
        </>
      ),
      content: (
        <TableSimple
          columns={reseauxEnConstructionColumns}
          data={reseauxEnConstruction ?? []}
          loading={isLoadingReseauxEnConstruction}
          fluid
          controlsLayout="block"
          padding="sm"
          loadingEmptyMessage="Aucun réseau en construction à afficher"
          height="calc(100dvh - 194px)"
          onRowClick={onTableRowClick}
          rowIdKey="id_fcu"
          enableGlobalFilter
          rowSelection={selectedTab === 'reseaux-en-construction' ? rowSelection : {}}
          topRightActions={
            (reseauxEnConstructionWithGeomUpdate || []).length > 0 ? (
              <Button size="small" priority="primary" variant="warning" iconId="fr-icon-refresh-line" onClick={handleSyncGeomUpdates}>
                Sync ({reseauxEnConstructionWithGeomUpdate?.length})
              </Button>
            ) : undefined
          }
        />
      ),
      isDefault: selectedTab === 'reseaux-en-construction',
    },
    {
      label: (
        <>
          {(perimetresDeDeveloppementPrioritaireWithGeomUpdate || []).length > 0 && (
            <Icon name="fr-icon-warning-line" size="sm" color="warning" />
          )}
          Périmètres de développement prioritaire ({perimetresDeDeveloppementPrioritaire?.length ?? 0})
        </>
      ),
      content: (
        <TableSimple
          columns={perimetresDeDeveloppementPrioritaireColumns}
          data={perimetresDeDeveloppementPrioritaire ?? []}
          loading={isLoadingPerimetresDeDeveloppementPrioritaire}
          fluid
          controlsLayout="block"
          padding="sm"
          loadingEmptyMessage="Aucun périmètre de développement prioritaire à afficher"
          height="calc(100dvh - 194px)"
          onRowClick={onTableRowClick}
          rowIdKey="id_fcu"
          enableGlobalFilter
          rowSelection={selectedTab === 'perimetres-de-developpement-prioritaire' ? rowSelection : {}}
          topRightActions={
            (perimetresDeDeveloppementPrioritaireWithGeomUpdate || []).length > 0 ? (
              <Button size="small" priority="primary" variant="warning" iconId="fr-icon-refresh-line" onClick={handleSyncGeomUpdates}>
                Sync ({perimetresDeDeveloppementPrioritaireWithGeomUpdate?.length})
              </Button>
            ) : undefined
          }
        />
      ),
      isDefault: selectedTab === 'perimetres-de-developpement-prioritaire',
    },
  ];

  return (
    <SimplePage
      title="Gestion des réseaux"
      description="Tableau d'administration pour gérer les réseaux de chaleur et en construction"
      mode="authenticated"
    >
      {totalGeomUpdates > 0 && (
        <Notice variant="warning" className="mb-4">
          <span className="flex items-center justify-center w-full gap-2">
            <span className="font-medium text-base">
              {totalGeomUpdates} modification{totalGeomUpdates > 1 ? 's' : ''} de géométrie en attente
            </span>
            <span className="text-sm text-gray-700 font-normal">
              <strong>({reseauxDeChaleurWithGeomUpdate?.length ?? 0}</strong> réseaux de chaleur,{' '}
              <strong>{reseauxEnConstructionWithGeomUpdate?.length ?? 0}</strong> réseaux en construction,{' '}
              <strong>{perimetresDeDeveloppementPrioritaireWithGeomUpdate?.length ?? 0}</strong> périmètres)
            </span>
          </span>
        </Notice>
      )}
      <div className="my-8">
        <ResizablePanelGroup direction="horizontal" className="gap-4">
          <ResizablePanel defaultSize={66}>
            <Tabs
              tabs={tabs}
              onTabChange={(event) => {
                const newTab = tabIds[event.tabIndex];
                void setSelectedTab(newTab);
                setUpdatedGeom(null);
                setEditingId(null);
                setSelectedNetwork(null);
              }}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={34}>
            <div className={cx('max-md:h-[700px] md:h-[calc(100dvh-56px)] bg-[#F8F4F0]')}>
              <Map
                noPopup
                withoutLogo
                initialMapConfiguration={createMapConfiguration({
                  reseauxDeChaleur: {
                    show: true,
                  },
                  reseauxEnConstruction: true,
                  zonesDeDeveloppementPrioritaire: true,
                  geomUpdate: true,
                  customGeojson: true,
                })}
                geolocDisabled
                withSoughtAddresses={false}
                bounds={selectedNetwork?.bbox}
                withLegend={false}
                onGeomDrop={setUpdatedGeom}
                geomUpdateFeatures={geomUpdateFeatures}
              >
                {!!editingId && (
                  <AdminEditLegend
                    enabledFeatures={
                      selectedTab === 'reseaux-de-chaleur'
                        ? ['reseauxDeChaleur']
                        : selectedTab === 'reseaux-en-construction'
                          ? ['reseauxEnConstruction']
                          : selectedTab === 'perimetres-de-developpement-prioritaire'
                            ? ['zonesDeDeveloppementPrioritaire']
                            : []
                    }
                  >
                    {selectedNetwork?.geom_delete ? (
                      <>
                        <div className="text-center text-sm mt-2">
                          Suppression du tracé de{' '}
                          <strong>
                            {(selectedNetwork as ReseauDeChaleur | ReseauEnConstruction)?.nom_reseau || selectedNetwork?.id_fcu}
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
                            disabled={!selectedNetwork}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
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
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setEditingId(null);
                              setUpdatedGeom(null);
                            }}
                          >
                            Fermer
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-center text-sm mt-2">
                          Modification du tracé de{' '}
                          <strong>
                            {(selectedNetwork as ReseauDeChaleur | ReseauEnConstruction)?.nom_reseau || selectedNetwork?.id_fcu}
                          </strong>
                        </div>
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
                              title="Annuler la modification"
                              loading={isDeletingGeomUpdate}
                              disabled={!selectedNetwork}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                void handleDeleteGeomUpdate();
                              }}
                            >
                              Annuler la modification
                            </Button>
                          ) : (
                            <Button
                              size="small"
                              variant="default"
                              priority="primary"
                              iconId="fr-icon-check-line"
                              title="Valider la modification"
                              loading={isUpdatingGeometry}
                              disabled={!selectedNetwork || !updatedGeom}
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                void handleValidateGeometry();
                              }}
                            >
                              Valider la modification
                            </Button>
                          )}
                          <Button
                            size="small"
                            variant="faded"
                            priority="tertiary"
                            iconId="fr-icon-close-line"
                            title="Annuler"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setEditingId(null);
                              setUpdatedGeom(null);
                            }}
                          >
                            Annuler
                          </Button>
                        </div>
                      </>
                    )}

                    {/* <div className="text-center text-sm mt-2">
                      Modifier le tracé de{' '}
                      <strong>{(selectedNetwork as ReseauDeChaleur | ReseauEnConstruction)?.nom_reseau || selectedNetwork?.id_fcu}</strong>
                    </div>

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
                      <Button
                        size="small"
                        variant="default"
                        priority="primary"
                        iconId="fr-icon-check-line"
                        title="Valider"
                        loading={isUpdatingGeometry}
                        disabled={!selectedNetwork || !updatedGeom}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          void handleValidateGeometry();
                        }}
                      >
                        Valider
                      </Button>
                      <Button
                        size="small"
                        variant="faded"
                        priority="tertiary"
                        iconId="fr-icon-close-line"
                        title="Fermer"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setEditingId(null);
                          setUpdatedGeom(null);
                        }}
                      >
                        Annuler
                      </Button>
                      {selectedNetwork?.geom_update && (
                        <Button
                          size="small"
                          variant="destructive"
                          priority="secondary"
                          iconId="fr-icon-delete-line"
                          title="Supprimer la géométrie modifiée"
                          loading={isDeletingGeomUpdate}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            void handleDeleteGeomUpdate();
                          }}
                        >
                          Supprimer
                        </Button>
                      )}
                    </div> */}
                  </AdminEditLegend>
                )}
              </Map>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SimplePage>
  );
};

export default GestionDesReseaux;
