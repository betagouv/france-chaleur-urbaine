import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import type { MouseHandlerDataParam } from 'recharts';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { eventTypeLabels } from '@/modules/events/constants';
import type { EventStats } from '@/modules/events/server/service';
import cx from '@/utils/cx';

import type { EventGranularity } from '../constants';

type EventsStatsSectionProps = {
  stats: EventStats | undefined;
  granularity: string;
  isLoading: boolean;
  onDateRangeChange?: (from: string, to: string) => void;
};

const granularityFormats: Record<EventGranularity, string> = {
  day: 'DD/MM',
  hour: 'DD/MM HH[h]',
  minute: 'HH:mm',
  month: 'MMM YYYY',
  week: 'DD/MM',
  year: 'YYYY',
};

const granularityUnitLabels: Record<EventGranularity, string> = {
  day: 'jour',
  hour: 'heure',
  minute: 'minute',
  month: 'mois',
  week: 'semaine',
  year: 'année',
};

/**
 * KPIs (total, moyenne) et graphiques Recharts (courbe d'activité avec zoom par sélection + répartition par type).
 * Maintient ses dimensions pendant le chargement pour éviter les sauts de layout.
 */
export function EventsStatsSection({ stats, granularity, isLoading, onDateRangeChange }: EventsStatsSectionProps) {
  const [chartType, setChartType] = useState<'area' | 'bar'>('bar');

  // Refs for drag-to-zoom — avoids stale closure issues with state-based booleans.
  const hoveredIdxRef = useRef<number | null>(null);
  const selectStartIdxRef = useRef<number | null>(null); // non-null = drag in progress
  // Only used for rendering the ReferenceArea during drag.
  const [selectionRange, setSelectionRange] = useState<{ x1: string; x2: string } | null>(null);

  const format = granularityFormats[granularity as EventGranularity] ?? 'DD/MM';
  const unitLabel = granularityUnitLabels[granularity as EventGranularity] ?? 'jour';

  const bucketCount = stats?.timeSeries.length || 1;
  const average = stats ? Math.round(stats.total / bucketCount) : null;
  const barChartHeight = Math.max(250, (stats?.typeDistribution.length ?? 5) * 28);

  const timeSeriesData = (stats?.timeSeries ?? []).map((point) => ({
    ...point,
    label: dayjs(point.bucket).format(format),
  }));

  const typeDistributionData = (stats?.typeDistribution ?? []).map((item) => ({
    ...item,
    typeLabel: eventTypeLabels[item.type],
  }));

  // React event handlers on the wrapper div — Recharts doesn't provide activeTooltipIndex
  // at mousedown time, so we use native React div events instead of Recharts chart events.
  const handleContainerMouseDown = () => {
    if (!onDateRangeChange) return;
    const idx = hoveredIdxRef.current;
    if (idx === null) return;
    selectStartIdxRef.current = idx;
    setSelectionRange(null);
  };

  const handleContainerMouseUp = () => {
    const startIdx = selectStartIdxRef.current;
    if (startIdx === null) return;
    const endIdx = hoveredIdxRef.current;
    selectStartIdxRef.current = null;
    setSelectionRange(null);
    if (endIdx === null || startIdx === endIdx) return;
    const fromIdx = Math.min(startIdx, endIdx);
    const toIdx = Math.max(startIdx, endIdx);
    const fromPoint = timeSeriesData[fromIdx];
    const toPoint = timeSeriesData[toIdx];
    if (fromPoint && toPoint) {
      onDateRangeChange?.(String(fromPoint.bucket), String(toPoint.bucket));
    }
  };

  // Recharts onMouseMove — tracks the hovered data index and updates the selection visual.
  const handleChartMouseMove = (state: MouseHandlerDataParam) => {
    const rawIdx = state.activeTooltipIndex;
    const idx = typeof rawIdx === 'number' ? rawIdx : typeof rawIdx === 'string' ? parseInt(rawIdx, 10) : null;
    if (idx !== null && !Number.isNaN(idx)) {
      hoveredIdxRef.current = idx;
    }
    const startIdx = selectStartIdxRef.current;
    if (startIdx === null || idx === null || Number.isNaN(idx)) return;
    const fromIdx = Math.min(startIdx, idx);
    const toIdx = Math.max(startIdx, idx);
    const x1 = timeSeriesData[fromIdx]?.label;
    const x2 = timeSeriesData[toIdx]?.label;
    if (x1 && x2 && fromIdx !== toIdx) {
      setSelectionRange({ x1, x2 });
    }
  };

  const handleChartMouseLeave = () => {
    if (selectStartIdxRef.current !== null) {
      selectStartIdxRef.current = null;
      setSelectionRange(null);
    }
  };

  const zoomProps = onDateRangeChange
    ? {
        onMouseLeave: handleChartMouseLeave,
        onMouseMove: handleChartMouseMove,
        style: { cursor: 'crosshair' } as React.CSSProperties,
      }
    : {};

  return (
    <div className={cx('flex flex-col gap-6 transition-opacity duration-150', isLoading && 'opacity-50 pointer-events-none')}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <KPICard title="Total événements" value={stats ? stats.total.toLocaleString('fr-FR') : '—'} />
        <KPICard
          title={`Moyenne par ${unitLabel}`}
          value={average !== null ? `${average.toLocaleString('fr-FR')} événement${average > 1 ? 's' : ''}/${unitLabel}` : '—'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold">Activité sur la période</h3>
            <button
              className="text-xs text-gray-500 border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50"
              onClick={() => setChartType((t) => (t === 'area' ? 'bar' : 'area'))}
            >
              {chartType === 'area' ? 'Barres' : 'Courbes'}
            </button>
          </div>
          {onDateRangeChange && <p className="text-xs text-gray-400 mb-3">Sélectionner une plage pour zoomer</p>}
          {stats && timeSeriesData.length === 0 ? (
            <EmptyChart height={250} />
          ) : (
            <div
              className={cx(onDateRangeChange && 'select-none')}
              onMouseDown={handleContainerMouseDown}
              onMouseUp={handleContainerMouseUp}
            >
              <ResponsiveContainer width="100%" height={250}>
                {chartType === 'area' ? (
                  <AreaChart data={timeSeriesData} {...zoomProps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" name="Événements" stroke="#000091" fill="#6A6AF4" fillOpacity={0.3} />
                    {selectionRange && (
                      <ReferenceArea x1={selectionRange.x1} x2={selectionRange.x2} fill="#6A6AF4" fillOpacity={0.3} strokeOpacity={0.3} />
                    )}
                  </AreaChart>
                ) : (
                  <BarChart data={timeSeriesData} {...zoomProps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" name="Événements" fill="#000091" />
                    {selectionRange && (
                      <ReferenceArea x1={selectionRange.x1} x2={selectionRange.x2} fill="#6A6AF4" fillOpacity={0.3} strokeOpacity={0.3} />
                    )}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-bold mb-4">Répartition par type</h3>
          {typeDistributionData.length === 0 ? (
            <EmptyChart height={barChartHeight} />
          ) : (
            <ResponsiveContainer width="100%" height={barChartHeight}>
              <BarChart data={typeDistributionData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis dataKey="typeLabel" type="category" width={200} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" name="Événements" fill="#000091" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

type KPICardProps = {
  title: string;
  value: string;
};

/**
 * Carte indicateur chiffré.
 */
function EmptyChart({ height }: { height: number }) {
  return (
    <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
      Aucune donnée pour les filtres sélectionnés
    </div>
  );
}

function KPICard({ title, value }: KPICardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-xs text-gray-500 mb-1">{title}</div>
      <div className="text-2xl font-bold text-blue-france">{value}</div>
    </div>
  );
}
