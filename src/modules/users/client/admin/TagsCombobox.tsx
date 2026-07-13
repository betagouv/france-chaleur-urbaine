import { useEffect, useMemo, useRef, useState } from 'react';

import Icon from '@/components/ui/Icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import { DEFAULT_TAG_COLOR } from '@/modules/users/constants';
import cx from '@/utils/cx';
import { stopPropagation } from '@/utils/events';
import { normalize } from '@/utils/strings';

import TagChip from './TagChip';
import UserTagBadge from './UserTagBadge';

type TagsComboboxProps = {
  /** Ids of the assigned tags. */
  value: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
};

/**
 * Trello-style multi-tag field: assigned tags are rendered as chips inside the field
 * (each chip opens a rename/recolor/remove/delete menu), and typing in the same field
 * filters the catalog or creates a new tag (grey by default). The dropdown is portaled
 * so it is not clipped by the surrounding Dialog.
 */
const TagsCombobox = ({ value, onChange, disabled }: TagsComboboxProps) => {
  const utils = trpc.useUtils();
  const { data: tags } = trpc.users.adminTags.list.useQuery();
  const catalog = tags ?? [];

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  // -1 = nothing highlighted (e.g. dropdown just opened on focus, no query yet).
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update the catalog cache in place so chips change instantly, without a refetch flash.
  // The admin users list is NOT invalidated here (see TagsEditor): it is refetched on dialog close.
  const createTag = trpc.users.adminTags.create.useMutation({
    onSuccess: (created) => utils.users.adminTags.list.setData(undefined, (old) => [...(old ?? []), created]),
  });
  const updateTag = trpc.users.adminTags.update.useMutation({
    onSuccess: (updated) =>
      utils.users.adminTags.list.setData(undefined, (old) => (old ?? []).map((tag) => (tag.id === updated.id ? updated : tag))),
  });
  const deleteTag = trpc.users.adminTags.delete.useMutation({
    onSuccess: (_result, { id }) => utils.users.adminTags.list.setData(undefined, (old) => (old ?? []).filter((tag) => tag.id !== id)),
  });

  const assignedTags = catalog.filter((tag) => value.includes(tag.id));

  const normalizedQuery = normalize(query.trim());
  const filteredOptions = useMemo(
    () => (normalizedQuery ? catalog.filter((tag) => normalize(tag.name).includes(normalizedQuery)) : catalog),
    [catalog, normalizedQuery]
  );
  const canCreate = normalizedQuery.length > 0 && !catalog.some((tag) => normalize(tag.name) === normalizedQuery);
  // Navigable rows = filtered options, plus a trailing "create" row when applicable.
  const itemCount = filteredOptions.length + (canCreate ? 1 : 0);
  const isCreateHighlighted = canCreate && highlightedIndex === filteredOptions.length;
  // Open on focus (show the whole catalog) or while typing; only when there is something to show.
  const popoverOpen = isOpen && itemCount > 0;

  useEffect(() => {
    // Preselect the first row when searching (Enter picks/creates it); nothing when the field is empty.
    setHighlightedIndex(normalizedQuery ? 0 : -1);
  }, [normalizedQuery]);

  // rAF (after React commit + paint) so the input keeps focus after an add/create re-render.
  const refocus = () => requestAnimationFrame(() => inputRef.current?.focus());

  const toggle = (tagId: string) => {
    onChange(value.includes(tagId) ? value.filter((id) => id !== tagId) : [...value, tagId]);
    setQuery('');
    refocus();
  };

  const handleCreate = toastErrors(async () => {
    const name = query.trim();
    if (!name) return;
    const created = await createTag.mutateAsync({ color: DEFAULT_TAG_COLOR, name });
    onChange([...value, created.id]);
    setQuery('');
    refocus();
  });

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && query === '' && assignedTags.length > 0) {
      toggle(assignedTags[assignedTags.length - 1].id);
      return;
    }
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }
    // Ignore arrows/Enter while no dropdown is shown (avoids toggling a hidden option).
    if (!popoverOpen) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((index) => (index >= itemCount - 1 ? 0 : index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((index) => (index <= 0 ? itemCount - 1 : index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (highlightedIndex < 0) return; // nothing highlighted → do nothing (no accidental toggle)
      if (highlightedIndex < filteredOptions.length) {
        toggle(filteredOptions[highlightedIndex].id);
      } else if (canCreate) {
        void handleCreate();
      }
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className={cx(
            // Mirrors `.fr-input`: contrast-grey bg, 2px bottom border, top-rounded corners, DSFR focus outline.
            'flex min-h-10 w-full cursor-text flex-wrap items-center gap-1 rounded-t-sm px-2 py-1',
            'text-(--text-default-grey) bg-(--background-contrast-grey) shadow-[inset_0_-2px_0_0_var(--border-plain-grey)]',
            'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0a76f6]',
            disabled && 'opacity-60 pointer-events-none'
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {assignedTags.map((tag) => (
            // stopPropagation: clicking a chip opens its menu without toggling the field.
            <span key={tag.id} onClick={stopPropagation}>
              <TagChip
                tag={tag}
                onRemove={() => toggle(tag.id)}
                onSave={(patch) => updateTag.mutateAsync({ id: tag.id, ...patch })}
                onDelete={async () => {
                  await deleteTag.mutateAsync({ id: tag.id });
                  onChange(value.filter((id) => id !== tag.id));
                }}
              />
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            className="flex-1 min-w-24 border-none outline-hidden! bg-transparent py-1 text-sm"
            placeholder={assignedTags.length === 0 ? 'Ajouter ou créer une étiquette…' : ''}
            value={query}
            disabled={disabled}
            onClick={stopPropagation}
            onFocus={(event) => {
              event.stopPropagation();
              setIsOpen(true);
            }}
            onChange={(event) => {
              event.stopPropagation();
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onKeyDown={(event) => {
              event.stopPropagation();
              handleKeyDown(event);
            }}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          inputRef.current?.focus();
        }}
        // Don't let Radix move focus to the (non-focusable) trigger div on close → it would land on <body>.
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        {/* stopPropagation on wheel: let this list scroll despite the parent Dialog's scroll-lock (react-remove-scroll). */}
        <ul className="max-h-60 overflow-auto p-0 my-0 list-none" onWheel={(event) => event.stopPropagation()}>
          {filteredOptions.map((tag, index) => (
            <li
              key={tag.id}
              className={cx(
                'flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-50',
                index === highlightedIndex && 'bg-blue-50'
              )}
              onMouseDown={(event) => {
                // Keep focus in the input (no blur) when picking an option with the mouse.
                event.preventDefault();
                toggle(tag.id);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className={cx('fr-icon-check-line', value.includes(tag.id) ? 'opacity-100' : 'opacity-0')} />
              <UserTagBadge name={tag.name} color={tag.color} />
            </li>
          ))}
          {canCreate && (
            <li
              className={cx('flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-blue-50', isCreateHighlighted && 'bg-blue-50')}
              onMouseDown={(event) => {
                event.preventDefault();
                void handleCreate();
              }}
              onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
            >
              <Icon name="fr-icon-add-line" size="sm" />
              <span>Créer «&nbsp;{query.trim()}&nbsp;»</span>
            </li>
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

export default TagsCombobox;
