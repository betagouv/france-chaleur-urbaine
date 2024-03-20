import { useEffect, useState } from 'react';
import { Popup } from 'react-map-gl/maplibre';
import { MapPopupType } from 'src/types/MapComponentsInfos';
import MapPopupContent, { ViasevaPopupContent } from './MapPopupContent';
import { Point } from 'src/types/Point';
import DynamicPopupContent, {
  isDynamicPopupContent,
} from './DynamicMapPopupContent';

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
          className={`popup-map-layer ${
            isDynamicPopupContent(content)
              ? 'popup-map-layer--fluid'
              : 'popup-map-layer--standard'
          }`}
          onClose={() => setShow(false)}
        >
          {isDynamicPopupContent(content) ? (
            <DynamicPopupContent content={content} />
          ) : (
            <>
              {type == MapPopupType.DEFAULT && <MapPopupContent {...content} />}
              {(type == MapPopupType.VIASEVA ||
                type == MapPopupType.ENGIE ||
                type === MapPopupType.DALKIA ||
                type === MapPopupType.IDEX) && (
                <ViasevaPopupContent {...content} />
              )}
            </>
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
