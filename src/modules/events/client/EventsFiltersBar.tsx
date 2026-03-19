import Tag from '@codegouvfr/react-dsfr/Tag';
import { useCallback, useMemo } from 'react';

import { ComboAutoComplete, type ComboAutoCompleteItem } from '@/components/ui/ComboAutoComplete';
import ComboBox from '@/components/ui/ComboBox';
import { eventTypeLabels, eventTypes } from '@/modules/events/constants';
import trpc from '@/modules/trpc/client';

type AuthorOption = { id: string; email: string; role: string };

type EventsFiltersBarProps = {
  types: string[];
  authorIds: string[];
  contextType: string | null;
  contextId: string | null;
  onTypesChange: (types: string[]) => void;
  onAuthorsChange: (ids: string[]) => void;
  onClearContext: () => void;
};

const typeOptions = eventTypes.map((t) => ({ key: t, label: eventTypeLabels[t] }));

/**
 * Barre de filtres : types d'événements (ComboBox multi-select) et auteurs (ComboAutoComplete async multi-select).
 * Les labels auteurs sont résolus via tRPC à partir des IDs stockés dans l'URL.
 */
export function EventsFiltersBar({
  types,
  authorIds,
  contextType,
  contextId,
  onTypesChange,
  onAuthorsChange,
  onClearContext,
}: EventsFiltersBarProps) {
  const utils = trpc.useUtils();

  const { data: fetchedAuthors, isLoading: isLoadingAuthors } = trpc.events.admin.getAuthorsByIds.useQuery(
    { ids: authorIds },
    { enabled: authorIds.length > 0 }
  );

  // Pendant le fetch, label=key → ComboAutoComplete affiche un skeleton pour chaque item sélectionné.
  // Après fetch, on remplace par les emails réels.
  const authors = useMemo<ComboAutoCompleteItem[]>(() => {
    if (!fetchedAuthors) return authorIds.map((id) => ({ key: id, label: id }));
    return fetchedAuthors.map((a) => ({ key: a.id, label: a.email }));
  }, [authorIds, fetchedAuthors]);

  const fetchAuthors = useCallback(
    async (query: string, _signal: AbortSignal) => {
      if (query.length < 2) return [];
      return utils.events.admin.searchAuthors.fetch({ search: query });
    },
    [utils]
  );

  const handleAuthorsChange = useCallback(
    (items: ComboAutoCompleteItem[]) => {
      onAuthorsChange(items.map((i) => i.key));
    },
    [onAuthorsChange]
  );

  const hasContextFilter = !!(contextType && contextId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-48 flex-1">
          <ComboBox
            multiple
            label="Types d'événements"
            options={typeOptions}
            placeholder="Tous les types..."
            value={types}
            onChange={onTypesChange}
          />
        </div>

        <div className="min-w-48 flex-1">
          <ComboAutoComplete<AuthorOption>
            fetchFn={fetchAuthors}
            getOptionKey={(a) => a.id}
            getOptionLabel={(a) => a.email}
            value={authors}
            isLoading={isLoadingAuthors && authorIds.length > 0}
            onChange={handleAuthorsChange}
            label="Auteurs"
            placeholder="Rechercher un auteur..."
            minCharThreshold={2}
          />
        </div>
      </div>

      {hasContextFilter && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag
            dismissible
            small
            nativeButtonProps={{
              onClick: onClearContext,
              title: 'Supprimer le filtre de contexte',
            }}
          >
            {`${contextType}:${contextId}`}
          </Tag>
        </div>
      )}
    </div>
  );
}
