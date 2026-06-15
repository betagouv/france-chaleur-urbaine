import { renderHook } from '@testing-library/react';
import type maplibregl from 'maplibre-gl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { MapCanvasController } from '../core/controller';
import { MapCanvasContext, type UserResources } from '../core/MapCanvasContext';
import { type MapDynamicLayer, type MapDynamicSource, useMapLayers } from './useMapLayers';

type FakeSource = { type: string; setData: ReturnType<typeof vi.fn> };

/** Minimal MapLibre stand-in tracking sources/layers in memory, with spies on every method `useMapLayers` calls. */
function createFakeMap() {
  const sources = new Map<string, FakeSource>();
  const layers = new Map<string, MapDynamicLayer>();
  const map = {
    /** Seed a source as if it already existed (static spec source / base vector source). */
    _seedSource: (id: string, type: string) => sources.set(id, { setData: vi.fn(), type }),
    addLayer: vi.fn((layer: MapDynamicLayer) => {
      layers.set(layer.id, layer);
    }),
    addSource: vi.fn((id: string, spec: { type: string }) => {
      sources.set(id, { setData: vi.fn(), type: spec.type });
    }),
    getLayer: vi.fn((id: string) => layers.get(id)),
    getSource: vi.fn((id: string) => sources.get(id)),
    removeLayer: vi.fn((id: string) => {
      layers.delete(id);
    }),
    removeSource: vi.fn((id: string) => {
      sources.delete(id);
    }),
  };
  return map;
}

type FakeMap = ReturnType<typeof createFakeMap>;

const emptyFc: GeoJSON.FeatureCollection = { features: [], type: 'FeatureCollection' };

function setup(
  initialProps: { sources?: MapDynamicSource[]; layers?: MapDynamicLayer[] },
  options: { mapReady?: boolean; map?: FakeMap } = {}
) {
  const map = options.map ?? createFakeMap();
  const mapReady = options.mapReady ?? true;
  const userResources: UserResources = { layers: new Set(), sources: new Set() };

  const wrapper = ({ children }: { children: ReactNode }) => (
    <MapCanvasContext.Provider
      value={{
        controller: {} as MapCanvasController,
        map: map as unknown as maplibregl.Map,
        mapReady,
        userResources,
      }}
    >
      {children}
    </MapCanvasContext.Provider>
  );

  const view = renderHook((props: { sources?: MapDynamicSource[]; layers?: MapDynamicLayer[] }) => useMapLayers(props), {
    initialProps,
    wrapper,
  });
  return { map, userResources, ...view };
}

describe('useMapLayers', () => {
  it('crée la source géojson + la couche et les enregistre dans userResources', () => {
    const data = { ...emptyFc };
    const { map, userResources } = setup({
      layers: [{ id: 'territories-fill', paint: {}, source: 'territories', type: 'fill' }],
      sources: [{ data, id: 'territories' }],
    });

    expect(map.addSource).toHaveBeenCalledWith('territories', { data, type: 'geojson' });
    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'territories-fill', source: 'territories' }));
    expect(userResources.sources.has('territories')).toBe(true);
    expect(userResources.layers.has('territories-fill')).toBe(true);
  });

  it('ne recrée pas une source déjà présente (spec statique) mais y pousse la donnée', () => {
    const map = createFakeMap();
    map._seedSource('adressesEligibles', 'geojson');
    const data = { ...emptyFc };

    setup({ sources: [{ data, id: 'adressesEligibles' }] }, { map });

    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.getSource('adressesEligibles')?.setData).toHaveBeenCalledWith(data);
  });

  it("ignore une couche dont la source n'est pas montée", () => {
    const { map, userResources } = setup({
      layers: [{ id: 'highlight', paint: {}, source: 'reseaux-de-chaleur', type: 'line' }],
    });

    expect(map.addLayer).not.toHaveBeenCalled();
    expect(userResources.layers.size).toBe(0);
  });

  it("applique le défaut source-layer 'layer' sur une source vector, et respecte une valeur explicite", () => {
    const map = createFakeMap();
    map._seedSource('reseaux-de-chaleur', 'vector');
    map._seedSource('user', 'geojson');

    setup(
      {
        layers: [
          { id: 'auto', paint: {}, source: 'reseaux-de-chaleur', type: 'line' },
          { id: 'explicit', paint: {}, source: 'reseaux-de-chaleur', 'source-layer': 'custom', type: 'line' },
          { id: 'geojson-layer', paint: {}, source: 'user', type: 'fill' },
        ],
      },
      { map }
    );

    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'auto', 'source-layer': 'layer' }));
    expect(map.addLayer).toHaveBeenCalledWith(expect.objectContaining({ id: 'explicit', 'source-layer': 'custom' }));
    expect(map.addLayer).toHaveBeenCalledWith(expect.not.objectContaining({ 'source-layer': expect.anything() }));
  });

  it('pousse la donnée seulement quand sa référence change (pas de setData inutile)', () => {
    const data1 = { ...emptyFc };
    const { map, rerender } = setup({ sources: [{ data: data1, id: 'territories' }] });

    // Source créée au mount : addSource pose déjà la donnée, donc pas de setData supplémentaire.
    const source = map.getSource('territories');
    expect(source?.setData).not.toHaveBeenCalled();

    // Même référence → aucun setData.
    rerender({ sources: [{ data: data1, id: 'territories' }] });
    expect(source?.setData).not.toHaveBeenCalled();

    // Nouvelle référence → un setData.
    const data2 = { ...emptyFc };
    rerender({ sources: [{ data: data2, id: 'territories' }] });
    expect(source?.setData).toHaveBeenCalledExactlyOnceWith(data2);
  });

  it('nettoie les couches et les sources créées au démontage', () => {
    const { map, userResources, unmount } = setup({
      layers: [{ id: 'territories-fill', paint: {}, source: 'territories', type: 'fill' }],
      sources: [{ data: { ...emptyFc }, id: 'territories' }],
    });

    unmount();

    expect(map.removeLayer).toHaveBeenCalledWith('territories-fill');
    expect(map.removeSource).toHaveBeenCalledWith('territories');
    expect(userResources.sources.size).toBe(0);
    expect(userResources.layers.size).toBe(0);
  });

  it('ne supprime pas au démontage une source pré-existante (jamais créée par le hook)', () => {
    const map = createFakeMap();
    map._seedSource('adressesEligibles', 'geojson');

    const { unmount } = setup({ sources: [{ data: { ...emptyFc }, id: 'adressesEligibles' }] }, { map });
    unmount();

    expect(map.removeSource).not.toHaveBeenCalled();
  });

  it('ne touche pas à la carte tant que mapReady est false', () => {
    const { map } = setup(
      {
        layers: [{ id: 'territories-fill', paint: {}, source: 'territories', type: 'fill' }],
        sources: [{ data: { ...emptyFc }, id: 'territories' }],
      },
      { mapReady: false }
    );

    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });
});
