import type { LegendInterval } from '@/modules/map/client/core/common';

/**
 * Color gradient bar with min/max labels — used by interval-based legends
 * (Besoins en chaleur, Besoins en froid, Besoins industrie, …).
 */
export function GradientBar({ intervals }: { intervals: LegendInterval[] }) {
  const first = intervals[0];
  const last = intervals[intervals.length - 1];
  return (
    <div>
      <div className="flex h-2.5 border border-(--border-default-grey) mb-3">
        {intervals.map((interval) => (
          <div
            key={interval.color}
            title={`${interval.min} – ${interval.max}`}
            className="flex-1"
            style={{ backgroundColor: interval.color }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs">
        <span>{first.min}</span>
        <span>{last.max}</span>
      </div>
    </div>
  );
}
