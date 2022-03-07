import { useLeafletContext } from '@react-leaflet/core';
import L from 'leaflet';
import 'leaflet.vectorgrid';
import { useEffect, useMemo } from 'react';
import './Leaflet.VectorGrid.d';

type VectorGridType = {
  url: string;
  style: any;
  attribution?: string;
  interactive?: boolean;
};

export default function VectorGrid({
  url,
  style = {},
  attribution = '',
  interactive,
}: VectorGridType) {
  const { layerContainer, map } = useLeafletContext();

  const options = useMemo(() => {
    return {
      attribution,
      vectorTileLayerStyles: {
        ...style,
      },
      interactive: interactive ?? false,
    };
  }, [attribution, interactive, style]);

  const vectorGrid = useMemo(
    () => (url ? L.vectorGrid.protobuf(url, options) : null),
    [options, url]
  );
  const container = useMemo(() => layerContainer || map, [layerContainer, map]);

  useEffect(() => {
    vectorGrid && container.addLayer(vectorGrid);
    return () => {
      vectorGrid && container.removeLayer(vectorGrid);
    };
  }, [container, vectorGrid]);

  return null;
}
