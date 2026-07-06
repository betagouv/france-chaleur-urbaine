import { keepPreviousData } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useCallback } from 'react';

import SimplePage from '@/components/shared/page/SimplePage';
import Box from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Loader from '@/components/ui/Loader';
import { EventsDashboardHeader } from '@/modules/events/client/EventsDashboardHeader';
import { EventsFiltersBar } from '@/modules/events/client/EventsFiltersBar';
import { EventsList } from '@/modules/events/client/EventsList';
import { EventsStatsSection } from '@/modules/events/client/EventsStatsSection';
import type { EventFilters } from '@/modules/events/client/types';
import { useEventsFilters } from '@/modules/events/client/useEventsFilters';
import { type EventPeriodPreset, eventGranularities } from '@/modules/events/constants';
import trpc from '@/modules/trpc/client';
import { exportAsXLSX } from '@/utils/export';

/**
 * Orchestrateur du dashboard événements admin : assemble header, stats, filtres et liste.
 */
export default function AdminEventsPage() {
  const { filters, setFilters, statsInput, baseInput, computedDateRange } = useEventsFilters();

  const utils = trpc.useUtils();

  const handleAuthorsChange = useCallback(
    (newAuthorIds: string[]) => {
      void setFilters({ authorIds: newAuthorIds });
    },
    [setFilters]
  );

  const { data: stats, isFetching: isFetchingStats } = trpc.events.admin.getStats.useQuery(statsInput, {
    placeholderData: keepPreviousData,
  });

  // Called when clicking on an event's author/context in the list — appends, never replaces
  const updateFilters = useCallback(
    (partial: Partial<EventFilters>) => {
      void setFilters((prev) => ({
        ...(partial.authorId &&
          !prev.authorIds.includes(partial.authorId) && {
            authorIds: [...prev.authorIds, partial.authorId],
          }),
        ...(partial.contextId !== undefined && { contextId: partial.contextId }),
        ...(partial.contextType !== undefined && { contextType: partial.contextType }),
        ...(partial.organizationId !== undefined && { organizationId: partial.organizationId }),
      }));
    },
    [setFilters]
  );

  // Called when the user drags a range on the activity chart.
  // Auto-downgrades granularity if the selected period would produce fewer than 2 buckets.
  const handleDateRangeChange = useCallback(
    (from: string, to: string) => {
      const diffMinutes = dayjs(to).diff(dayjs(from), 'minute');
      const diffHours = dayjs(to).diff(dayjs(from), 'hour');
      const diffDays = dayjs(to).diff(dayjs(from), 'day');
      const currentGranularity = filters.granularity;

      const currentBuckets = (() => {
        switch (currentGranularity) {
          case 'minute':
            return diffMinutes;
          case 'hour':
            return diffHours;
          case 'day':
            return diffDays;
          case 'week':
            return diffDays / 7;
          case 'month':
            return diffDays / 30;
          case 'year':
            return diffDays / 365;
        }
      })();

      let granularity = currentGranularity;
      if (currentBuckets < 2) {
        if (diffHours < 2) granularity = 'minute';
        else if (diffHours < 48) granularity = 'hour';
        else if (diffDays < 14) granularity = 'day';
        else if (diffDays < 90) granularity = 'week';
        else granularity = 'month';
        // Ensure we don't suggest a granularity finer than what's in the allowed list
        if (!eventGranularities.includes(granularity)) granularity = currentGranularity;
      }

      void setFilters({
        dateFrom: from,
        dateTo: to,
        preset: 'custom',
        ...(granularity !== currentGranularity && { granularity }),
      });
    },
    [filters.granularity, setFilters]
  );

  const handleExport = useCallback(() => {
    if (!stats) return;
    exportAsXLSX('événements_export.xlsx', [
      {
        columns: [
          { accessorKey: 'type' as const, name: 'Type' },
          { accessorKey: 'count' as const, name: 'Nombre' },
        ],
        data: stats.typeDistribution,
        name: 'Répartition',
      },
    ]);
  }, [stats]);

  const handleRefresh = useCallback(() => utils.events.admin.invalidate(), [utils]);

  const handlePresetChange = useCallback(
    (preset: EventPeriodPreset) => {
      if (preset === 'custom') {
        void setFilters({
          dateFrom: dayjs(computedDateRange.from).format('YYYY-MM-DDTHH:mm'),
          dateTo: dayjs(computedDateRange.to).format('YYYY-MM-DDTHH:mm'),
          preset,
        });
      } else {
        void setFilters({ dateFrom: null, dateTo: null, preset });
      }
    },
    [computedDateRange, setFilters]
  );

  return (
    <SimplePage title="Activité du site" mode="authenticated">
      <Box className="fr-container" py="4w">
        <div className="flex items-center gap-3">
          <Heading as="h1" color="blue-france">
            Activité du site
          </Heading>
          {isFetchingStats && <Loader size="sm" />}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-64">
              <EventsFiltersBar
                authorIds={filters.authorIds}
                contextId={filters.contextId}
                contextType={filters.contextType}
                organizationId={filters.organizationId}
                types={filters.types}
                onAuthorsChange={handleAuthorsChange}
                onClearContext={() => void setFilters({ contextId: null, contextType: null })}
                onClearOrganization={() => void setFilters({ organizationId: null })}
                onTypesChange={(types) => void setFilters({ types })}
              />
            </div>

            <div className="shrink-0">
              <EventsDashboardHeader
                dateFrom={filters.dateFrom}
                dateTo={filters.dateTo}
                granularity={filters.granularity}
                preset={filters.preset}
                onDateFromChange={(date) => void setFilters({ dateFrom: date, preset: 'custom' })}
                onDateToChange={(date) => void setFilters({ dateTo: date, preset: 'custom' })}
                onExport={handleExport}
                onGranularityChange={(granularity) => void setFilters({ granularity })}
                onPresetChange={handlePresetChange}
                onRefresh={handleRefresh}
              />
            </div>
          </div>

          <EventsStatsSection
            granularity={filters.granularity}
            isLoading={isFetchingStats}
            stats={stats}
            onDateRangeChange={handleDateRangeChange}
          />

          <EventsList baseInput={baseInput} onFilterChange={updateFilters} />
        </div>
      </Box>
    </SimplePage>
  );
}
