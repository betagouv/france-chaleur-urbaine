import dynamic from 'next/dynamic';
import { parseAsBoolean, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useRef } from 'react';

import useRouterReady from '@/hooks/useRouterReady';
import cx from '@/utils/cx';

import type { MapCanvasController } from '../core/controller';
import type { MapProps } from '../core/MapImpl';
import { FlyToButtons } from './FlyToButtons';

const Map = dynamic(() => import('../core/MapImpl').then((mod) => mod.Map), { ssr: false });
const MapV1Demo = dynamic(() => import('./MapV1Demo'), { ssr: false });

const legendOptions = ['false', 'hidden', 'auto'] as const;
const searchOptions = ['none', 'network', 'eligibility'] as const;

const sandboxParams = {
  interactive: parseAsBoolean.withDefault(true),
  legend: parseAsStringLiteral(legendOptions).withDefault('auto'),
  search: parseAsStringLiteral(searchOptions).withDefault('none'),
  v1: parseAsBoolean.withDefault(false),
  v2: parseAsBoolean.withDefault(true),
};

const baseConfig: MapProps['config'] = { reseauxDeChaleur: { show: true } };
const baseInitialView: MapProps['initialView'] = { center: [2.3522, 48.8566], zoom: 5 };

/**
 * Sandbox shell for the map V2 module.
 *
 * One `<Map>` instance, piloted by a tiny form: toggle `interactive`, pick a
 * `legend` mode, pick a `search` mode. The selected values are reflected in
 * the URL via `nuqs` so combinations can be shared.
 *
 * `<MapV1Demo>` is kept around for side-by-side V1 reference checks.
 */
export function Sandbox() {
  const [params, setParam] = useQueryStates(sandboxParams, { history: 'replace' });
  const isRouterReady = useRouterReady();
  const mapRef = useRef<MapCanvasController | null>(null);

  if (!isRouterReady) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 p-4">
      <header className="flex flex-col gap-2">
        <h1 className="text-xl font-bold">Map V2 — sandbox</h1>
        <p className="text-sm text-(--text-mention-grey)">
          Une seule instance de <code>&lt;Map&gt;</code> pilotée ci-dessous. Modifie les paramètres pour visualiser chaque combinaison.
        </p>
      </header>

      <section className="flex flex-wrap items-end gap-4 rounded border border-(--border-default-grey) bg-white p-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={params.v2} onChange={(e) => void setParam({ v2: e.target.checked })} className="size-4" />
          Afficher Map V2
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={params.v1} onChange={(e) => void setParam({ v1: e.target.checked })} className="size-4" />
          Afficher Map V1 (réf)
        </label>
        <div className="h-6 w-px bg-(--border-default-grey)" aria-hidden />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={params.interactive}
            onChange={(e) => void setParam({ interactive: e.target.checked })}
            className="size-4"
          />
          <code>interactive</code>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-(--text-mention-grey)">
            <code>legend</code>
          </span>
          <select
            value={String(params.legend)}
            onChange={(e) => void setParam({ legend: e.target.value as (typeof legendOptions)[number] })}
            className="rounded border border-(--border-default-grey) px-2 py-1"
          >
            {legendOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-(--text-mention-grey)">
            <code>search</code>
          </span>
          <select
            value={params.search}
            onChange={(e) => void setParam({ search: e.target.value as (typeof searchOptions)[number] })}
            className="rounded border border-(--border-default-grey) px-2 py-1"
          >
            {searchOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <div className="h-6 w-px bg-(--border-default-grey)" aria-hidden />
        <div className="flex flex-col gap-1">
          <span className="text-xs text-(--text-mention-grey)">flyTo (controller)</span>
          <FlyToButtons mapRef={mapRef} />
        </div>
      </section>

      <div className={cx('grid flex-1 gap-4', params.v1 && params.v2 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1')}>
        {params.v2 && (
          <section className="flex min-h-[600px] flex-col gap-2">
            <h2 className="text-base font-semibold">
              <code>&lt;Map&gt;</code> V2
            </h2>
            <div className="relative flex-1 overflow-hidden rounded border border-(--border-default-grey)">
              <Map
                key={`interactive=${params.interactive}`}
                mapRef={mapRef}
                config={baseConfig}
                initialView={baseInitialView}
                interactive={params.interactive}
                legend={params.legend === 'false' ? false : params.legend}
                search={params.search}
              />
            </div>
          </section>
        )}

        {params.v1 && (
          <section className="flex min-h-[600px] flex-col gap-2">
            <h2 className="text-base font-semibold">V1 (référence)</h2>
            <div className="relative flex-1 overflow-hidden rounded border border-(--border-default-grey)">
              <MapV1Demo />
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
