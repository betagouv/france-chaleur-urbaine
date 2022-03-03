import { useMap } from 'react-leaflet';

const MapGlobalOptions = ({
  attributionPrefix,
}: {
  attributionPrefix: string;
}) => {
  const map = useMap();

  map.attributionControl.setPrefix(attributionPrefix);

  return null;
};

export default MapGlobalOptions;
