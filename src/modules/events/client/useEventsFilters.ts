import dayjs from 'dayjs';
import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs';
import { useMemo } from 'react';

import { type EventPeriodPreset, type EventType, eventGranularities, eventPeriodPresets } from '../constants';

const parsers = {
  authorIds: parseAsArrayOf(parseAsString).withDefault([]),
  contextId: parseAsString,
  contextType: parseAsString,
  dateFrom: parseAsString,
  dateTo: parseAsString,
  granularity: parseAsStringLiteral(eventGranularities).withDefault('day'),
  preset: parseAsStringLiteral(eventPeriodPresets).withDefault('1m'),
  types: parseAsArrayOf(parseAsString).withDefault([]),
};

export function useEventsFilters() {
  const [filters, setFilters] = useQueryStates(parsers, { history: 'push' });

  const computedDateRange = useMemo(() => {
    const now = dayjs();

    const dateRangePresets: Record<EventPeriodPreset, () => { from: dayjs.Dayjs; to: dayjs.Dayjs }> = {
      '1h': () => ({ from: now.subtract(1, 'hour'), to: now }),
      '1m': () => ({ from: now.subtract(1, 'month').startOf('day'), to: now }),
      '1w': () => ({ from: now.subtract(1, 'week').startOf('day'), to: now }),
      '1y': () => ({ from: now.subtract(1, 'year').startOf('day'), to: now }),
      '2m': () => ({ from: now.subtract(2, 'month').startOf('day'), to: now }),
      '2w': () => ({ from: now.subtract(2, 'week').startOf('day'), to: now }),
      '3m': () => ({ from: now.subtract(3, 'month').startOf('day'), to: now }),
      '6m': () => ({ from: now.subtract(6, 'month').startOf('day'), to: now }),
      custom: () => ({
        from: filters.dateFrom ? dayjs(filters.dateFrom) : now.subtract(30, 'day').startOf('day'),
        to: filters.dateTo ? dayjs(filters.dateTo) : now,
      }),
      today: () => ({ from: now.startOf('day'), to: now }),
    };

    const range = dateRangePresets[filters.preset]();

    return { from: range.from.toDate(), to: range.to.toDate() };
  }, [filters.preset, filters.dateFrom, filters.dateTo]);

  const baseInput = useMemo(
    () => ({
      authorIds: filters.authorIds.length > 0 ? filters.authorIds : undefined,
      contextId: filters.contextType && filters.contextId ? filters.contextId : undefined,
      contextType: filters.contextType && filters.contextId ? filters.contextType : undefined,
      dateFrom: computedDateRange.from,
      dateTo: computedDateRange.to,
      types: filters.types.length > 0 ? (filters.types as EventType[]) : undefined,
    }),
    [computedDateRange, filters.types, filters.authorIds, filters.contextType, filters.contextId]
  );

  const statsInput = useMemo(
    () => ({
      ...baseInput,
      granularity: filters.granularity,
    }),
    [baseInput, filters.granularity]
  );

  return {
    baseInput,
    computedDateRange,
    filters,
    setFilters,
    statsInput,
  };
}
