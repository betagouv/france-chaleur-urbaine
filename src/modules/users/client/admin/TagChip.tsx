import { useState } from 'react';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { useDialogState } from '@/hooks/useDialogState';
import { toastErrors } from '@/modules/notification';
import type { UserTagColor } from '@/modules/users/constants';
import type { UserTag } from '@/modules/users/server/tags-service';
import { getContrastTextColor } from '@/utils/color';

import TagColorPicker from './TagColorPicker';

type TagChipProps = {
  tag: UserTag;
  /** Detaches the tag from the current user (not from the catalog). */
  onRemove: () => void;
  /** Persists name/color changes to the catalog (affects every user). */
  onSave: (patch: { name: string; color: UserTagColor }) => Promise<unknown>;
  /** Deletes the tag from the catalog (detaches it from every user). */
  onDelete: () => Promise<unknown>;
};

/**
 * Assigned tag rendered as a clickable chip. The menu is a small form: "Retirer de cet
 * utilisateur" (user-scoped) on top, then the catalog edit form (name + color) with
 * Enregistrer / Supprimer. ArrowDown on the chip opens the menu.
 */
const TagChip = ({ tag, onRemove, onSave, onDelete }: TagChipProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const deleteConfirm = useDialogState();

  const trimmedName = name.trim();
  const isDirty = trimmedName !== '' && (trimmedName !== tag.name || color !== tag.color);

  const handleSave = toastErrors(async () => {
    if (!isDirty) return;
    await onSave({ color, name: trimmedName });
    setOpen(false);
  });

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) {
            // Reset the draft to the current tag on each open (a concurrent edit may have happened).
            setName(tag.name);
            setColor(tag.color);
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Modifier l'étiquette"
            className="fr-tag fr-tag--sm cursor-pointer"
            style={{ backgroundColor: tag.color, color: getContrastTextColor(tag.color) }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setOpen(true);
              }
            }}
          >
            {tag.name}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 border border-solid border-gray-300 p-4 shadow-lg">
          <Button
            type="button"
            priority="tertiary"
            size="small"
            iconId="fr-icon-close-line"
            className="w-full justify-center mb-4"
            onClick={() => {
              onRemove();
              setOpen(false);
            }}
          >
            Retirer l'étiquette
          </Button>

          <div className="fr-input-group mb-3">
            <label className="fr-label" htmlFor={`tag-name-${tag.id}`}>
              Nom
            </label>
            <input
              id={`tag-name-${tag.id}`}
              className="fr-input"
              value={name}
              maxLength={50}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void handleSave();
              }}
            />
          </div>

          <div className="mb-4">
            <div className="fr-label mb-2">Couleur</div>
            <TagColorPicker value={color} onChange={setColor} />
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button type="button" priority="primary" size="small" disabled={!isDirty} onClick={() => void handleSave()}>
              Enregistrer
            </Button>
            <Button
              type="button"
              variant="destructive"
              priority="tertiary"
              size="small"
              iconId="fr-icon-delete-line"
              onClick={() => {
                setOpen(false);
                deleteConfirm.open();
              }}
            >
              Supprimer
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <ConfirmDialog
        control={deleteConfirm}
        title="Supprimer l'étiquette"
        danger
        confirmLabel="Supprimer"
        onConfirm={async () => {
          await onDelete();
        }}
      >
        L'étiquette <strong>{tag.name}</strong> sera retirée de tous les utilisateurs qui la portent. Cette action est irréversible.
      </ConfirmDialog>
    </>
  );
};

export default TagChip;
