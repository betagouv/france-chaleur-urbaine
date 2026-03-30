import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch';
import { keepPreviousData } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import VirtualList from '@/components/ui/VirtualList';
import useQueryFlag from '@/hooks/useQueryFlag';
import { EventRow } from '@/modules/events/client/EventRow';
import type { EventType } from '@/modules/events/constants';
import type { AdminEvent } from '@/modules/events/server/service';
import trpc from '@/modules/trpc/client';

import type { EventFilters } from './types';

type ListInput = {
  authorIds?: string[];
  contextId?: string;
  contextType?: string;
  dateFrom: Date;
  dateTo: Date;
  types?: EventType[];
};

type EventsListProps = {
  baseInput: ListInput;
  onFilterChange: (filters: Partial<EventFilters>) => void;
};

const PAGE_SIZE = 50;

/**
 * Liste d'événements avec scroll infini via VirtualList (onNearEnd), virtualisation et toggle détails.
 * Conserve les données précédentes pendant un changement de filtre (keepPreviousData) pour éviter
 * les flashs — les pages sont réinitialisées seulement quand les nouvelles données arrivent
 * (isPlaceholderData passe à false).
 */
export function EventsList({ baseInput, onFilterChange }: EventsListProps) {
  const [showDetails, toggleShowDetails] = useQueryFlag('details');
  const [offset, setOffset] = useState(0);

  const inputKey = JSON.stringify(baseInput);

  const { data, isLoading, isFetching, isPlaceholderData } = trpc.events.admin.list.useQuery(
    { ...baseInput, cursor: offset, limit: PAGE_SIZE },
    { placeholderData: keepPreviousData }
  );

  // Pages stockées par offset. Réinitialisées seulement quand de vraies nouvelles données
  // arrivent (isPlaceholderData = false), pas dès le changement de filtre.
  const pagesRef = useRef<Record<number, AdminEvent[]>>({});
  const prevInputKeyRef = useRef(inputKey);

  if (data && !isPlaceholderData) {
    if (prevInputKeyRef.current !== inputKey) {
      prevInputKeyRef.current = inputKey;
      pagesRef.current = {};
    }
    pagesRef.current[offset] = data.events;
  }

  const accumulatedEvents = useMemo(
    () =>
      Object.keys(pagesRef.current)
        .map(Number)
        .sort((a, b) => a - b)
        .flatMap((k) => pagesRef.current[k]),
    [data, offset, isPlaceholderData]
  );

  useEffect(() => {
    setOffset(0);
  }, [inputKey]);

  const total = data?.total ?? 0;
  const hasMore = accumulatedEvents.length < total;

  const loadMore = useCallback(() => {
    if (!isFetching && hasMore) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  }, [isFetching, hasMore]);

  const BoundEventRow = useCallback(
    ({ item }: { item: AdminEvent }) => <EventRow event={item} showDetails={showDetails} updateFilters={onFilterChange} />,
    [onFilterChange, showDetails]
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {isLoading ? (
            'Chargement...'
          ) : (
            <>
              {accumulatedEvents.length.toLocaleString('fr-FR')} événements affichés sur {total.toLocaleString('fr-FR')}
              {isFetching && offset > 0 && ' — chargement...'}
            </>
          )}
        </div>
        <ToggleSwitch checked={showDetails} label="Afficher les détails" onChange={() => toggleShowDetails()} />
      </div>

      <VirtualList
        estimateSize={48}
        getItemKey={(item) => item.id}
        items={accumulatedEvents}
        renderRow={BoundEventRow}
        onNearEnd={loadMore}
      />
    </div>
  );
}
