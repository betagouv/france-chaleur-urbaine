import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-map-gl';

const MapMarker = ({
  longitude,
  latitude,
  color = '#4550e5',
  popup = false,
  popup_content = '',
}: {
  longitude: number;
  latitude: number;
  color?: string;
  popup?: boolean;
  popup_content?: string;
}) => {
  const [show, setShow] = useState<boolean>(false);
  const [showPopup, setShowPopup] = useState<boolean>(false);

  useEffect(() => {
    if (popup && popup_content != '') {
      setShow(showPopup);
    } else {
      setShow(false);
    }
  }, [popup, popup_content, showPopup]);

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      color={color}
      onClick={() => setShowPopup(true)}
    >
      {show && popup && popup_content != '' && (
        <Popup
          longitude={longitude}
          latitude={latitude}
          offset={[0, -10]}
          onClose={() => setShowPopup(false)}
          onOpen={() => setShowPopup(true)}
        >
          {popup_content}
        </Popup>
      )}
    </Marker>
  );
};

export default MapMarker;
