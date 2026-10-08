import type { CcrtNote } from '../types';

type CcrtNoteCardProps = { note: CcrtNote };

/**
 * Displays a shared history note without editing or deletion actions.
 */
export function CcrtNoteCard({ note }: CcrtNoteCardProps) {
  return (
    <div>
      <p className="mb-0 whitespace-pre-wrap">{note.body}</p>
      {note.updated_at !== note.created_at && <p className="mb-0 text-sm">Note modifiée</p>}
    </div>
  );
}
