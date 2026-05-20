import { Marker, Popup, type PositionAnchor } from 'maplibre-gl';
import { type ReactNode, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useMapInstance } from '../core/MapCanvasContext';

type MapMarkerProps = {
  longitude: number;
  latitude: number;
  /** CSS color string (defaults to MapLibre's blue). */
  color?: string;
  /** Anchor of the marker relative to the lng/lat. Defaults to `'center'`. */
  anchor?: PositionAnchor;
  /**
   * Optional React-rendered popup. Receives a `close` callback so the content
   * can render its own dismiss button (the maplibre default × is hidden, to
   * match the layer popups' close-in-title pattern).
   */
  popupContent?: (close: () => void) => ReactNode;
};

/** `maplibregl.Marker` overlay. Must be rendered as a child of `<MapCanvas>`. */
export function MapMarker({ longitude, latitude, color, anchor, popupContent }: MapMarkerProps) {
  const map = useMapInstance();
  const markerRef = useRef<Marker | null>(null);
  const popupRef = useRef<Popup | null>(null);
  // Stable DOM container the popup renders into — React owns its content via portal.
  const popupContainer = useMemo(() => (popupContent ? document.createElement('div') : null), [!!popupContent]);

  useEffect(() => {
    const marker = new Marker({ anchor, color }).setLngLat([longitude, latitude]);
    if (popupContainer) {
      const popup = new Popup({ closeButton: false, closeOnClick: false, maxWidth: '320px', offset: 24 }).setDOMContent(popupContainer);
      marker.setPopup(popup);
      popupRef.current = popup;
    }
    marker.addTo(map);
    markerRef.current = marker;
    return () => {
      marker.remove();
      popupRef.current = null;
      markerRef.current = null;
    };
  }, [map, color, anchor, popupContainer]);

  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [longitude, latitude]);

  if (!popupContainer || !popupContent) return null;
  const close = () => popupRef.current?.remove();
  return createPortal(popupContent(close), popupContainer);
}
