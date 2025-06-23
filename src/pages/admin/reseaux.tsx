import Tabs from '@codegouvfr/react-dsfr/Tabs';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { useCallback, useMemo, useState } from 'react';

import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useFetch } from '@/hooks/useApi';
import { type AdminReseauxResponse } from '@/pages/api/admin/reseaux';
import cx from '@/utils/cx';

const tabIds = ['reseaux-de-chaleur', 'reseaux-en-construction'] as const;

const GestionDesReseaux = () => {
  const [selectedTab, setSelectedTab] = useQueryState('tab', parseAsStringLiteral(tabIds).withDefault('reseaux-de-chaleur'));

  const [selectedNetwork, setSelectedNetwork] = useState<
    AdminReseauxResponse['reseauxDeChaleur'][number] | AdminReseauxResponse['reseauxEnConstruction'][number] | null
  >(null);

  const { data: networks, isLoading } = useFetch<AdminReseauxResponse>('/api/admin/reseaux');

  const onTableRowClick = useCallback(
    (idFCU: number) => {
      setSelectedNetwork(
        (selectedTab === 'reseaux-de-chaleur' ? networks?.reseauxDeChaleur : networks?.reseauxEnConstruction)?.find(
          (reseau) => reseau.id_fcu === idFCU
        ) ?? null
      );
    },
    [networks, selectedTab]
  );

  const reseauxDeChaleurColumns = useMemo<ColumnDef<AdminReseauxResponse['reseauxDeChaleur'][number]>[]>(
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
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: () => (
          <></>
          // TODO: Implémenter ChipAutoComplete pour les tags
        ),
        width: '400px',
      },
    ],
    []
  );

  const reseauxEnConstructionColumns = useMemo<ColumnDef<AdminReseauxResponse['reseauxEnConstruction'][number]>[]>(
    () => [
      {
        accessorKey: 'id_fcu',
        header: 'id_fcu',
        width: '100px',
      },
      {
        accessorKey: 'tags',
        header: 'Tags',
        cell: () => (
          <></>
          // TODO: Implémenter ChipAutoComplete pour les tags
        ),
        width: '400px',
      },
    ],
    []
  );

  const tabs = [
    {
      label: `Réseaux de chaleur (${networks?.reseauxDeChaleur.length ?? 0})`,
      content: (
        <TableSimple
          columns={reseauxDeChaleurColumns}
          data={networks?.reseauxDeChaleur ?? []}
          loading={isLoading}
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
      label: `Réseaux en construction (${networks?.reseauxEnConstruction.length ?? 0})`,
      content: (
        <TableSimple
          columns={reseauxEnConstructionColumns}
          data={networks?.reseauxEnConstruction ?? []}
          loading={isLoading}
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
