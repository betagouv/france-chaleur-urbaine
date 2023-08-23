import { useCallback, useEffect, useState } from 'react';
import { Marker, Popup } from 'react-map-gl';
import { Point } from 'src/types/Point';

const MapMarker = ({
  id,
  longitude,
  latitude,
  color = '#4550e5',
  popup = false,
  popupContent = '',
  onClickAction = undefined,
}: {
  id: string;
  longitude: number;
  latitude: number;
  color?: string;
  popup?: boolean;
  popupContent?: string;
  onClickAction?: (arg: string) => void;
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

  const onClickMarker = useCallback(() => {
    if (onClickAction != undefined) {
      onClickAction(id);
    }
    setShowPopup(true);
  }, [onClickAction, id]);

  return (
    <Marker
      longitude={longitude}
      latitude={latitude}
      color={color}
      onClick={() => onClickMarker()}
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
