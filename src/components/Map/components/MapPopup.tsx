import { useEffect, useState } from 'react';
import { Popup } from 'react-map-gl';
import { MapPopupType } from 'src/types/MapComponentsInfos';
import MapPopupContent, { ViasevaPopupContent } from './MapPopupContent';
import { Point } from 'src/types/Point';

const MapPopup = ({
  longitude,
  latitude,
  content,
  type = MapPopupType.DEFAULT,
}: {
  longitude: number;
  latitude: number;
  content: { [x: string]: any };
  type?: MapPopupType;
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
          offset={[0, -10] as Point}
          closeButton
          className="popup-map-layer"
          onClose={() => setShow(false)}
        >
          {type == MapPopupType.DEFAULT && <MapPopupContent {...content} />}
          {(type == MapPopupType.VIASEVA ||
            type == MapPopupType.ENGIE ||
            type === MapPopupType.DALKIA) && (
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
