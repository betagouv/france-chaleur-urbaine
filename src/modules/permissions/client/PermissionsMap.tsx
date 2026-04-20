import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { Layer, Source } from 'react-map-gl/maplibre';

import { createMapConfiguration } from '@/components/Map/map-configuration';
import Loader from '@/components/ui/Loader';
import type { BoundingBox } from '@/modules/geo/types';
import trpc from '@/modules/trpc/client';

const FCUMap = dynamic(() => import('@/components/Map/Map'), { ssr: false });

const highlightColor = '#e11d48';

const mapConfiguration = createMapConfiguration({
  reseauxDeChaleur: { show: true },
  reseauxEnConstruction: true,
  zonesDeDeveloppementPrioritaire: true,
});

/**
 * Displays the user's permissions on an interactive map,
 * highlighting their networks and territories.
 */
const PermissionsMap = () => {
  const { data: mapData, isLoading } = trpc.permissions.myMapData.useQuery(undefined);

  const bounds = useMemo<BoundingBox | undefined>(() => {
    return mapData?.bounds ? mapData.bounds : undefined;
  }, [mapData?.bounds]);

  const mapChildren = useMemo(() => {
    if (!mapData) return null;

    const { highlightReseauxExistants, highlightReseauxEnConstruction, highlightPdpIdsFcu, territories } = mapData;

    return (
      <>
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

  if (isLoading || !mapData) {
    return <Loader />;
  }

  return (
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
  );
};

export default PermissionsMap;
