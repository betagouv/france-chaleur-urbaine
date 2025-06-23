import { useCallback, useMemo, useState } from 'react';

import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import SimplePage from '@/components/shared/page/SimplePage';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable';
import TableSimple, { type ColumnDef } from '@/components/ui/TableSimple';
import { useFetch } from '@/hooks/useApi';
import { type AdminReseauxResponse } from '@/pages/api/admin/reseaux';
import cx from '@/utils/cx';

const GestionDesReseaux = () => {
  const [selectedNetwork, setSelectedNetwork] = useState<AdminReseauxResponse['reseauxDeChaleur'][number] | null>(null);

  const { data: networks, isLoading } = useFetch<AdminReseauxResponse>('/api/admin/reseaux');

  const onTableRowClick = useCallback(
    (idFCU: number) => {
      setSelectedNetwork(networks?.reseauxDeChaleur.find((reseau) => reseau.id_fcu === idFCU) ?? null);
    },
    [networks]
  );

  const columns = useMemo<ColumnDef<AdminReseauxResponse['reseauxDeChaleur'][number]>[]>(
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

  return (
    <SimplePage
      title="Gestion des réseaux"
      description="Tableau d'administration pour gérer les réseaux de chaleur et en construction"
      mode="authenticated"
    >
      <div className="mb-8">
        <ResizablePanelGroup direction="horizontal" className="gap-4">
          <ResizablePanel defaultSize={66}>
            <TableSimple
              columns={columns}
              data={networks?.reseauxDeChaleur ?? []}
              loading={isLoading}
              fluid
              controlsLayout="block"
              padding="sm"
              loadingEmptyMessage="Aucun réseau à afficher"
              height="calc(100dvh - 140px)"
              onRowClick={onTableRowClick}
              rowIdKey="id_fcu"
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
