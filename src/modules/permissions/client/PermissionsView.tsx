import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { createMapConfiguration } from '@/components/Map/map-configuration';
import Accordion from '@/components/ui/Accordion';
import Loader from '@/components/ui/Loader';
import type { BoundingBox } from '@/modules/geo/types';
import trpc from '@/modules/trpc/client';

import type { PermissionWithLabel } from '../types';

const FCUMap = dynamic(() => import('@/components/Map/Map'), { ssr: false });

const highlightColor = '#e11d48';

const mapConfiguration = createMapConfiguration({
  reseauxDeChaleur: { show: true },
  reseauxEnConstruction: true,
  zonesDeDeveloppementPrioritaire: true,
});

const PermissionsView = () => {
  const [mapExpanded, setMapExpanded] = useState(false);
  const { data: permissions, isLoading: isLoadingPermissions } = trpc.permissions.mineWithLabels.useQuery();
  const { data: mapData, isLoading: isLoadingMap } = trpc.permissions.myMapData.useQuery(undefined, { enabled: mapExpanded });

  const bounds = useMemo<BoundingBox | undefined>(() => {
    if (!mapData?.bounds) return undefined;
    return mapData.bounds as BoundingBox;
  }, [mapData?.bounds]);

  const mapChildren = useMemo(() => {
    if (!mapData) return null;

    const { highlightReseauxExistants, highlightReseauxEnConstruction, highlightPdpIdsFcu, territories } = mapData;

    return (
      <>
        {/* Highlight existing networks */}
        {highlightReseauxExistants.length > 0 && (
          <Layer
            id="permissions-highlight-reseaux-existants"
            source="reseaux-de-chaleur"
            source-layer="layer"
            type="line"
            paint={{
              'line-color': highlightColor,
              'line-opacity': 0.9,
              'line-width': 4,
            }}
            filter={['in', ['get', 'id_fcu'], ['literal', highlightReseauxExistants]]}
          />
        )}

        {/* Highlight construction networks */}
        {highlightReseauxEnConstruction.length > 0 && (
          <Layer
            id="permissions-highlight-reseaux-construction"
            source="reseaux-en-construction"
            source-layer="layer"
            type="line"
            paint={{
              'line-color': highlightColor,
              'line-opacity': 0.9,
              'line-width': 4,
            }}
            filter={['all', ['==', ['get', 'is_zone'], false], ['in', ['get', 'id_fcu'], ['literal', highlightReseauxEnConstruction]]]}
          />
        )}

        {/* Highlight construction network zones */}
        {highlightReseauxEnConstruction.length > 0 && (
          <Layer
            id="permissions-highlight-reseaux-construction-zones"
            source="reseaux-en-construction"
            source-layer="layer"
            type="fill"
            paint={{
              'fill-color': highlightColor,
              'fill-opacity': 0.2,
            }}
            filter={['all', ['==', ['get', 'is_zone'], true], ['in', ['get', 'id_fcu'], ['literal', highlightReseauxEnConstruction]]]}
          />
        )}

        {/* Highlight PDP zones */}
        {highlightPdpIdsFcu.length > 0 && (
          <Layer
            id="permissions-highlight-pdp"
            source="perimetres-de-developpement-prioritaire"
            source-layer="layer"
            type="fill"
            paint={{
              'fill-color': highlightColor,
              'fill-opacity': 0.15,
            }}
            filter={['in', ['get', 'id_fcu'], ['literal', highlightPdpIdsFcu]]}
          />
        )}

        {/* Territory geometries */}
        {territories.features.length > 0 && (
          <Source id="user-territories" type="geojson" data={territories}>
            <Layer
              id="user-territories-fill"
              type="fill"
              paint={{
                'fill-color': highlightColor,
                'fill-opacity': 0.12,
              }}
            />
            <Layer
              id="user-territories-outline"
              type="line"
              paint={{
                'line-color': highlightColor,
                'line-opacity': 0.8,
                'line-width': 2,
              }}
            />
          </Source>
        )}
      </>
    );
  }, [mapData]);

  if (isLoadingPermissions) {
    return <Loader />;
  }

  if (!permissions || permissions.length === 0) {
    return <p className="text-sm text-faded">Aucune permission configurée pour votre compte.</p>;
  }

  return (
    <div className="space-y-4">
      <PermissionsList permissions={permissions} />

      <Accordion label="Voir sur la carte" simple expanded={mapExpanded} onExpandedChange={setMapExpanded}>
        {isLoadingMap ? (
          <Loader />
        ) : (
          <div className="h-[500px]">
            <FCUMap
              initialMapConfiguration={mapConfiguration}
              withLegend={false}
              withSoughtAddresses={false}
              geolocDisabled
              bounds={bounds}
              noPopup
              mapChildren={mapChildren}
            />
          </div>
        )}
      </Accordion>
    </div>
  );
};

const formatPermission = (p: PermissionWithLabel): string => {
  switch (p.type) {
    case 'commune':
      return `sur la commune de ${p.label}`;
    case 'epci':
      return `au sein de l'EPCI ${p.label}`;
    case 'ept':
      return `au sein de l'EPT ${p.label}`;
    case 'departement':
      return `dans le département ${p.label}`;
    case 'region':
      return `dans la région ${p.label}`;
    case 'national':
      return `sur l'ensemble du territoire national`;
    case 'reseau_existant':
      return `liées au réseau existant ${p.label}`;
    case 'reseau_en_construction':
      return `liées au réseau en construction ${p.label}`;
  }
};

const PermissionsList = ({ permissions }: { permissions: PermissionWithLabel[] }) => {
  return (
    <div>
      <p className="text-sm font-medium mb-1">J'ai accès aux demandes :</p>
      <ul className="list-disc list-inside text-sm space-y-1">
        {permissions.map((p) => (
          <li key={`${p.type}-${p.resourceId}`}>{formatPermission(p)}</li>
        ))}
      </ul>
    </div>
  );
};

export default PermissionsView;
