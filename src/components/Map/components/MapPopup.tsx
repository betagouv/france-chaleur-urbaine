import { useEffect, useState } from 'react';
import { Popup } from 'react-map-gl';
import MapPopupContent, { ViasevaPopupContent } from './MapPopupContent';

const MapPopup = ({
  longitude,
  latitude,
  content,
  is_viaseva,
}: {
  longitude: number;
  latitude: number;
  content: { [x: string]: any };
  is_viaseva: boolean | false;
}) => {
  const [show, setShow] = useState<boolean>(false);

  useEffect(() => {
    {
      content.coldNetwork &&
        (content.network = { ...content.coldNetwork, isCold: true });
    }
    setShow(true);
  }, [content, latitude, longitude]);

  return (
    <>
      {show ? (
        <Popup
          longitude={longitude}
          latitude={latitude}
          offset={[0, -10]}
          closeButton={false}
          className="popup-map-layer"
          onClose={() => setShow(false)}
        >
          {!is_viaseva ? (
            <MapPopupContent {...content} />
          ) : (
            <ViasevaPopupContent {...content} />
          )}
        </Popup>
      ) : (
        ''
      )}
      ;
    </>
  );
};

export default MapPopup;
