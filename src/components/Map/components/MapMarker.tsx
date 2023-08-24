import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-map-gl';
import { Point } from 'src/types/Point';

const MapMarker = ({
  longitude,
  latitude,
  color = '#4550e5',
  popup = false,
  popupContent = '',
}: {
  longitude: number;
  latitude: number;
  color?: string;
  popup?: boolean;
  popupContent?: string;
}) => {
  const [show, setShow] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);

  useEffect(() => {
    if (popup && popupContent != '') {
      setShow(showPopup);
    } else {
      setShow(false);
    }
  }, [popup, popupContent, showPopup]);

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      color={color}
      onClick={() => setShowPopup(true)}
    >
      {show && popup && popupContent != '' && (
        <Popup
          longitude={longitude}
          latitude={latitude}
          offset={[0, -10] as Point}
          onClose={() => setShowPopup(false)}
          onOpen={() => setShowPopup(true)}
        >
          {popupContent}
        </Popup>
      )}
    </Marker>
  );
};

export default MapMarker;
