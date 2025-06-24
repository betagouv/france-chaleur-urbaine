import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import ChipAutoComplete from '@/components/ui/ChipAutoComplete';
import Link from '@/components/ui/Link';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useFetch } from '@/hooks/useApi';
import { type ReseauDeChaleur } from '@/pages/api/admin/reseaux-de-chaleur';
import { type ReseauEnConstruction } from '@/pages/api/admin/reseaux-en-construction';
import { withAuthentication } from '@/server/authentication';
import { useFCUTags } from '@/services/tags';
import { isDefined } from '@/utils/core';
import cx from '@/utils/cx';

const tabIds = ['reseaux-de-chaleur', 'reseaux-en-construction'] as const;

const GestionDesReseaux = () => {
  const [selectedTab, setSelectedTab] = useQueryState('tab', parseAsStringLiteral(tabIds).withDefault('reseaux-de-chaleur'));

  const [selectedNetwork, setSelectedNetwork] = useState<ReseauDeChaleur | ReseauEnConstruction | null>(null);

  const { data: reseauxDeChaleur, isLoading: isLoadingReseauxDeChaleur } = useFetch<ReseauDeChaleur[]>('/api/admin/reseaux-de-chaleur');
  const { data: reseauxEnConstruction, isLoading: isLoadingReseauxEnConstruction } = useFetch<ReseauEnConstruction[]>(
    '/api/admin/reseaux-en-construction'
  );
  const { tagsOptions } = useFCUTags();

  const onTableRowClick = useCallback(
    (idFCU: number) => {
      setSelectedNetwork(
        (selectedTab === 'reseaux-de-chaleur' ? reseauxDeChaleur : reseauxEnConstruction)?.find((reseau) => reseau.id_fcu === idFCU) ?? null
      );
    },
    [reseauxDeChaleur, selectedTab]
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
        accessorKey: 'communes',
        header: 'Communes',
        width: '200px',
        cell: ({ row }) => row.original.communes?.join(', '),
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: (info) => (
          <div className="block">
            <ChipAutoComplete options={tagsOptions} value={info.getValue<string[]>() ?? []} onChange={() => {}} />
          </div>
        ),
        width: '400px',
        enableSorting: false,
      },
    ],
    [tagsOptions]
  );

  const reseauxEnConstructionColumns = useMemo<ColumnDef<ReseauEnConstruction>[]>(
    () => [
      {
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorKey: 'gestionnaire',
        header: 'Gestionnaire',
        width: '150px',
      },
      {
        accessorKey: 'communes',
        header: 'Communes',
        width: '200px',
        cell: ({ row }) => row.original.communes?.join(', '),
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: (info) => (
          <div className="block">
            <ChipAutoComplete options={tagsOptions} value={info.getValue<string[]>() ?? []} onChange={() => {}} />
          </div>
        ),
        width: '400px',
        enableSorting: false,
      },
    ],
    [tagsOptions]
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
          height="calc(100dvh - 200px)"
          onRowClick={onTableRowClick}
          rowIdKey="id_fcu"
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
          height="calc(100dvh - 200px)"
          onRowClick={onTableRowClick}
          rowIdKey="id_fcu"
        />
      ),
      isDefault: selectedTab === 'reseaux-en-construction',
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
                const newTab = event.tabIndex === 0 ? 'reseaux-de-chaleur' : 'reseaux-en-construction';
                setSelectedTab(newTab);
                setSelectedNetwork(null);
              }}
            />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={34}>
            <div className={cx('max-md:h-[600px] md:h-[calc(100dvh-140px)] bg-[#F8F4F0]')}>
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
