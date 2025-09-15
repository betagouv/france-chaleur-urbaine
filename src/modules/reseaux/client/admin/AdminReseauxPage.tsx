import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import TableFieldInput from '@/components/Admin/TableFieldInput';
import FCUTagAutocomplete from '@/components/form/FCUTagAutocomplete';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useFetch } from '@/hooks/useApi';
import trpc, { type RouterOutput } from '@/modules/trpc/client';
import { type PerimetreDeDeveloppementPrioritaire } from '@/pages/api/admin/perimetres-de-developpement-prioritaire';
import { toastErrors } from '@/services/notification';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { patchFetchJSON } from '@/utils/network';

const tabIds = ['reseaux-de-chaleur', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire'] as const;

type ReseauDeChaleur = RouterOutput['reseaux']['list'][number];
type ReseauEnConstruction = RouterOutput['reseaux']['listEnConstruction'][number];

const GestionDesReseaux = () => {
  const [selectedTab, setSelectedTab] = useQueryState('tab', parseAsStringLiteral(tabIds).withDefault('reseaux-de-chaleur'));

  const [selectedNetwork, setSelectedNetwork] = useState<
    ReseauDeChaleur | ReseauEnConstruction | PerimetreDeDeveloppementPrioritaire | null
  >(null);

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
  } = useFetch<PerimetreDeDeveloppementPrioritaire[]>('/api/admin/perimetres-de-developpement-prioritaire');

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

  const updatePerimetreDeDeveloppementPrioritaire = useCallback(
    toastErrors(async (pdpId: number, pdpUpdate: Partial<PerimetreDeDeveloppementPrioritaire>) => {
      await patchFetchJSON(`/api/admin/perimetres-de-developpement-prioritaire/${pdpId}`, pdpUpdate);
      await refetchPerimetresDeDeveloppementPrioritaire();
    }),
    []
  );

  const reseauxDeChaleurColumns = useMemo<ColumnDef<ReseauDeChaleur>[]>(
    () => [
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
      {
        id: 'actions',
        header: 'Actions',
        cell: () => (
          <div className="flex gap-2">
            <Button
              size="small"
              priority="tertiary"
              iconId="fr-icon-edit-line"
              title="Modifier le tag"
              onClick={() => {
                // setEditingTag(row.original);
                // setEditTagName(row.original.name);
                // setEditTagType(row.original.type);
                // setIsEditDialogOpen(true);
              }}
            />
          </div>
        ),
        width: '120px',
      },
    ],
    [updateReseauDeChaleur]
  );

  const reseauxEnConstructionColumns = useMemo<ColumnDef<ReseauEnConstruction>[]>(
    () => [
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
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorFn: (row) => row.communes?.join(', '),
        header: 'Communes',
        width: '200px',
      },
      {
        accessorKey: 'Identifiant reseau',
        header: 'ID SNCU',
        width: '140px',
        cell: (info) => {
          const network = info.row.original;
          return (
            <TableFieldInput
              title="ID SNCU"
              value={network['Identifiant reseau']}
              onChange={(value) =>
                updatePerimetreDeDeveloppementPrioritaire(network.id_fcu, {
                  'Identifiant reseau': value,
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
                updatePerimetreDeDeveloppementPrioritaire(network.id_fcu, {
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
                updatePerimetreDeDeveloppementPrioritaire(network.id_fcu, {
                  reseau_en_construction_ids: value ? value.split(',').map(Number) : [],
                })
              }
            />
          );
        },
      },
    ],
    []
  );

  const tabs = [
    {
      label: `Réseaux de chaleur (${reseauxDeChaleur?.length ?? 0})`,
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
        />
      ),
      isDefault: selectedTab === 'reseaux-de-chaleur',
    },
    {
      label: `Réseaux en construction (${reseauxEnConstruction?.length ?? 0})`,
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
        />
      ),
      isDefault: selectedTab === 'reseaux-en-construction',
    },
    {
      label: `Périmètres de développement prioritaire (${perimetresDeDeveloppementPrioritaire?.length ?? 0})`,
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
      <div className="mb-8">
        <ResizablePanelGroup direction="horizontal" className="gap-4">
          <ResizablePanel defaultSize={66}>
            <Tabs
              tabs={tabs}
              onTabChange={(event) => {
                const newTab = tabIds[event.tabIndex];
                void setSelectedTab(newTab);
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
                })}
                geolocDisabled
                withSoughtAddresses={false}
                bounds={selectedNetwork?.bbox}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </SimplePage>
  );
};

export default GestionDesReseaux;
