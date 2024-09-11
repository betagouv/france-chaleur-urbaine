import { useAtomValue } from 'jotai';
import { Marker, LngLat, LngLatLike, MapMouseEvent } from 'maplibre-gl';
import React, { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

import { mapRefAtom } from '../atoms';

interface Tracé {
  id: string;
  coordinates: LngLatLike[];
  color: string;
  distance: number;
}

const getRandomColor = (): string => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

const calculateDistance = (coordinates: LngLatLike[]): number => {
  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const from = new LngLat(coordinates[i - 1][0], coordinates[i - 1][1]);
    const to = new LngLat(coordinates[i][0], coordinates[i][1]);
    totalDistance += from.distanceTo(to);
  }
  return totalDistance; // distance en mètres
};

const MeasurementMap: React.FC = () => {
  const mapRef = useAtomValue(mapRefAtom);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [traces, setTraces] = useState<Tracé[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [activeTrace, setActiveTrace] = useState<Tracé | null>(null);
  const [markers, setMarkers] = useState<Marker[]>([]);

  const startMeasurement = () => {
    const newTrace: Tracé = {
      id: Math.random().toString(36).substr(2, 9),
      coordinates: [],
      color: getRandomColor(),
      distance: 0,
    };

    setActiveTrace(newTrace);
    setIsMeasuring(true);
  };

  const addMarker = (lngLat: LngLatLike) => {
    if (!mapRef || !activeTrace) return;

    // Ajouter les coordonnées au tracé actif
    const newCoordinates = [...activeTrace.coordinates, lngLat];
    const newTrace = { ...activeTrace, coordinates: newCoordinates };
    newTrace.distance = calculateDistance(newCoordinates);

    // Mettre à jour le tracé actif
    setActiveTrace(newTrace);

    // Ajouter un marqueur sur la carte
    const marker = new Marker().setLngLat(lngLat).addTo(mapRef.getMap());

    setMarkers([...markers, marker]);

    // Mettre à jour la liste des tracés
    const updatedTraces = traces.filter((t) => t.id !== newTrace.id).concat(newTrace);
    setTraces(updatedTraces);

    // Dessiner la ligne
    mapRef.getMap().addSource(`trace-${newTrace.id}`, {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: newTrace.coordinates,
        },
      },
    });

    mapRef.getMap().addLayer({
      id: `trace-line-${newTrace.id}`,
      type: 'line',
      source: `trace-${newTrace.id}`,
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': newTrace.color,
        'line-width': 4,
        'line-dasharray': [2, 4], // Définir les pointillés
      },
    });

    // Afficher les distances sur chaque segment
    for (let i = 1; i < newCoordinates.length; i++) {
      const midPoint = [(newCoordinates[i][0] + newCoordinates[i - 1][0]) / 2, (newCoordinates[i][1] + newCoordinates[i - 1][1]) / 2];

      const distance = new LngLat(newCoordinates[i - 1][0], newCoordinates[i - 1][1]).distanceTo(
        new LngLat(newCoordinates[i][0], newCoordinates[i][1])
      );

      new Marker({ element: createDistanceMarkerElement(distance) }).setLngLat(midPoint).addTo(mapRef.current!);
    }
  };

  const stopMeasurement = () => {
    if (!activeTrace) return;
    setIsMeasuring(false);
    setActiveTrace(null);
  };

  const createDistanceMarkerElement = (distance: number): HTMLElement => {
    const el = document.createElement('div');
    el.className = 'distance-marker';
    el.textContent = `${distance.toFixed(2)} m`;
    return el;
  };

  const handleMapClick = (e: MapMouseEvent) => {
    if (!isMeasuring || !activeTrace) return;
    addMarker(e.lngLat.toArray());
  };

  useEffect(() => {
    if (!mapRef) return;

    mapRef.on('click', handleMapClick);

    return () => {
      if (mapRef) {
        mapRef.off('click', handleMapClick);
      }
    };
  }, [isMeasuring, activeTrace]);

  return (
    <div>
      <div style={{ height: '400px' }} ref={mapContainerRef}></div>
      <button onClick={startMeasurement} disabled={isMeasuring}>
        Démarrer la mesure
      </button>
      <button onClick={stopMeasurement} disabled={!isMeasuring}>
        Terminer la mesure
      </button>

      <h3>Tracés :</h3>
      <ul>
        {traces.map((trace) => (
          <li key={trace.id}>
            <span style={{ color: trace.color }}>●</span> {trace.id} - {trace.distance.toFixed(2)} m
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MeasurementMap;
