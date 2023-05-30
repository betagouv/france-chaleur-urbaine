import maplibregl from 'maplibre-gl';
import React, { useCallback, useEffect, useRef, useState } from 'react';

type useMapPopupOptionType = {
  className?: string;
  bodyFormater?: (arg: any) => string;
};

const useMapPopup = (
  map: any,
  { className, bodyFormater }: useMapPopupOptionType = {}
) => {
  const clickedPointCtx: React.MutableRefObject<any[]> = useRef([]);
  const userPopUp = useRef(new maplibregl.Popup({ className }));
  const [clickedPoint, setClickedPoint]: [
    any | never[],
    React.Dispatch<any | never[]>
  ] = useState([]);

  const updateClickedPoint = useCallback(
    (
      coordinates: any,
      {
        buildings,
        consommation,
        demands,
        energy,
        network,
        raccordement,
        futurNetwork,
      }: any
    ) => {
      const [lon, lat] = coordinates;
      const idCoords = `${lon.toFixed(4)}--${lat.toFixed(4)}`;

      const isNot =
        (func: (...args: any) => boolean) =>
        (...args: any) =>
          !func(...args);
      const isCurrentPoint = ({ id }: any) => id === idCoords;

      clickedPointCtx.current = [
        ...clickedPointCtx.current.filter(isNot(isCurrentPoint)),
        {
          ...(clickedPointCtx.current.find(isCurrentPoint) || {}),
          id: idCoords,
          coordinates,
          ...(buildings ? { buildings } : {}),
          ...(consommation ? { consommation } : {}),
          ...(demands ? { demands } : {}),
          ...(energy ? { energy } : {}),
          ...(network ? { network } : {}),
          ...(raccordement ? { raccordement } : {}),
          ...(futurNetwork ? { futurNetwork } : {}),
        },
      ];
      setClickedPoint(clickedPointCtx.current);
    },
    []
  );

  const showPopUp = useCallback(
    (data: any) => {
      const { coordinates } = data;
      const bodyPopup = bodyFormater
        ? bodyFormater(data)
        : JSON.stringify(data);
      userPopUp.current
        .setLngLat({ lon: coordinates[0], lat: coordinates[1] })
        .setHTML(bodyPopup)
        .addTo(map);
    },
    [bodyFormater, map]
  );

  useEffect(() => {
    const currentClickedPoint = clickedPoint[clickedPoint.length - 1];
    if (currentClickedPoint) {
      showPopUp(currentClickedPoint);
    }
  }, [clickedPoint, showPopUp]);

  return [userPopUp.current, clickedPoint, updateClickedPoint];
};

export default useMapPopup;
