import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import bbox from '@turf/bbox';
import { useEffect, useMemo, useState } from 'react';

import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { useMapConfig } from '@/modules/map/client/config/useMapConfig';
import { MapFitBounds } from '@/modules/map/client/interactions/MapFitBounds';
import { type MapDynamicSource, useMapLayers } from '@/modules/map/client/layers/useMapLayers';
import { Map } from '@/modules/map/client/Map';
import trpc from '@/modules/trpc/client';

import type { NetworkChangeRequestGeometryRole } from '../constants';

const geometryMaxZoom = 15;

type RequestGeometryMapProps = {
  requestId: string;
  geometryRole: NetworkChangeRequestGeometryRole;
};

/**
 * Before / after map of a trace or perimeter request: the current networks (base layers) and the proposed geometry
 * (orange, « modification en attente » style), each toggleable so the admin can see the delta.
 */
function RequestGeometryMap({ requestId, geometryRole }: RequestGeometryMapProps) {
  const { data: geometry } = trpc.networkChangeRequests.admin.getRequestGeometry.useQuery({ id: requestId, role: geometryRole });
  const [showProposed, setShowProposed] = useState(true);
  const [showCurrent, setShowCurrent] = useState(true);
  const features = useMemo<GeoJSON.Feature[]>(
    () => (geometry && showProposed ? [{ geometry, properties: { nom_reseau: 'Géométrie proposée' }, type: 'Feature' }] : []),
    [geometry, showProposed]
  );
  const geometryBbox = useMemo(() => (geometry ? (bbox(geometry) as [number, number, number, number]) : undefined), [geometry]);

  if (!geometry) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-4">
        <Checkbox
          small
          className="mb-0!"
          options={[
            {
              label: 'Géométrie proposée (orange)',
              nativeInputProps: { checked: showProposed, onChange: () => setShowProposed(!showProposed) },
            },
            { label: 'Réseaux actuels', nativeInputProps: { checked: showCurrent, onChange: () => setShowCurrent(!showCurrent) } },
          ]}
          orientation="horizontal"
        />
      </div>
      <div className="h-[420px]">
        <Map
          config={createMapConfiguration({
            geomUpdate: true,
            reseauxDeChaleur: { show: true },
            reseauxDeFroid: true,
            reseauxEnConstruction: true,
            zonesDeDeveloppementPrioritaire: true,
          })}
          legend={false}
          // opens directly on the geometry; a later change (file replaced by a GeoJSON) moves the camera
          initialView={geometryBbox && { bbox: geometryBbox, maxZoom: geometryMaxZoom }}
        >
          <ProposedGeometryLayer features={features} />
          <CurrentNetworksVisibility visible={showCurrent} />
          <MapFitBounds bbox={geometryBbox} maxZoom={geometryMaxZoom} duration={0} />
        </Map>
      </div>
    </div>
  );
}

export default RequestGeometryMap;

/** Pushes the proposed geometry into the `geomUpdate` source (same rendering as a pending draft on the networks admin). */
type ProposedGeometryLayerProps = { features: GeoJSON.Feature[] };

function ProposedGeometryLayer({ features }: ProposedGeometryLayerProps) {
  const sources = useMemo<MapDynamicSource[]>(() => [{ data: { features, type: 'FeatureCollection' }, id: 'geomUpdate' }], [features]);
  useMapLayers({ sources });
  return null;
}

/** Toggles the base network layers so the proposed geometry can be looked at alone. */
type CurrentNetworksVisibilityProps = { visible: boolean };

function CurrentNetworksVisibility({ visible }: CurrentNetworksVisibilityProps) {
  const { updateProperty } = useMapConfig();
  // the layer visibility lives in the map store: sync it with the checkbox
  useEffect(() => {
    updateProperty('reseauxDeChaleur.show', visible);
    updateProperty('reseauxDeFroid', visible);
    updateProperty('reseauxEnConstruction', visible);
    updateProperty('zonesDeDeveloppementPrioritaire', visible);
  }, [visible, updateProperty]);
  return null;
}
