import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import TableFieldInput from '@/components/Admin/TableFieldInput';
import FCUTagAutocomplete from '@/components/form/FCUTagAutocomplete';
import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import Link from '@/components/ui/Link';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useFetch } from '@/hooks/useApi';
import { type PerimetreDeDeveloppementPrioritaire } from '@/pages/api/admin/perimetres-de-developpement-prioritaire';
import { type ReseauDeChaleur } from '@/pages/api/admin/reseaux-de-chaleur';
import { type ReseauEnConstruction } from '@/pages/api/admin/reseaux-en-construction';
import { withAuthentication } from '@/server/authentication';
import { toastErrors } from '@/services/notification';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';
import { patchFetchJSON } from '@/utils/network';

const tabIds = ['reseaux-de-chaleur', 'reseaux-en-construction', 'perimetres-de-developpement-prioritaire'] as const;

const GestionDesReseaux = () => {
  const [selectedTab, setSelectedTab] = useQueryState('tab', parseAsStringLiteral(tabIds).withDefault('reseaux-de-chaleur'));

  const [selectedNetwork, setSelectedNetwork] = useState<
    ReseauDeChaleur | ReseauEnConstruction | PerimetreDeDeveloppementPrioritaire | null
  >(null);

  const {
    data: reseauxDeChaleur,
    isLoading: isLoadingReseauxDeChaleur,
    refetch: refetchReseauxDeChaleur,
  } = useFetch<ReseauDeChaleur[]>('/api/admin/reseaux-de-chaleur');
  const {
    data: reseauxEnConstruction,
    isLoading: isLoadingReseauxEnConstruction,
    refetch: refetchReseauxEnConstruction,
  } = useFetch<ReseauEnConstruction[]>('/api/admin/reseaux-en-construction');
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

  const updateReseauDeChaleur = useCallback(
    toastErrors(async (reseauId: number, reseauUpdate: Partial<ReseauDeChaleur>) => {
      await patchFetchJSON(`/api/admin/reseaux-de-chaleur/${reseauId}`, reseauUpdate);
      refetchReseauxDeChaleur();
    }),
    []
  );

  const updateReseauEnConstruction = useCallback(
    toastErrors(async (reseauId: number, reseauUpdate: Partial<ReseauEnConstruction>) => {
      await patchFetchJSON(`/api/admin/reseaux-en-construction/${reseauId}`, reseauUpdate);
      refetchReseauxEnConstruction();
    }),
    []
  );

  const updatePerimetreDeDeveloppementPrioritaire = useCallback(
    toastErrors(async (pdpId: number, pdpUpdate: Partial<PerimetreDeDeveloppementPrioritaire>) => {
      await patchFetchJSON(`/api/admin/perimetres-de-developpement-prioritaire/${pdpId}`, pdpUpdate);
      refetchPerimetresDeDeveloppementPrioritaire();
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
                updateReseauDeChaleur(info.row.original.id_fcu, { tags })
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
                updateReseauEnConstruction(info.row.original.id_fcu, { tags })
              }
              multiple
            />
          </div>
        ),
        width: '400px',
        enableSorting: false,
      },
    ],
    [updateReseauEnConstruction]
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
                setSelectedTab(newTab);
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

export const getServerSideProps = withAuthentication(['admin']);
