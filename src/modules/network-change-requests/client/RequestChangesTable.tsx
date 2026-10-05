import { Badge } from '@codegouvfr/react-dsfr/Badge';

import Button from '@/components/ui/Button';
import TableBasic from '@/components/ui/TableBasic';
import { type FileScanStatus, fileScanStatusLabels } from '@/modules/files/constants';
import cx from '@/utils/cx';
import { formatFileSize } from '@/utils/strings';

/**
 * A file of a row: a document the network page would list once the request is applied (`kept`, `added`, `removed`), or a file
 * attached to a geometry change (`attached`: informational, the row itself is the change).
 */
export type RequestChangeFile = {
  /** inclusion key when the file is a change (added or removed), see `documentChangeKey` / `documentRemovalChangeKey` */
  key: string;
  fileId: string;
  filename: string;
  size: number;
  href: string;
  status: 'kept' | 'added' | 'removed' | 'attached' | 'replaced';
  /** antivirus status of an uploaded file (none for a document already published) */
  scanStatus?: FileScanStatus;
  /** content dropped (retention): the name stays, nothing to download */
  purged?: boolean;
};

export type RequestChangeRow = {
  /** Value currently stored on the network (null when unknown or empty). */
  current: unknown;
  key: string;
  label: string;
  /** A change the admin cannot exclude (e.g. the geometry of a network under construction, which is the request itself). */
  locked?: boolean;
  proposed: unknown;
  /** A row listing documents instead of a value: each added or removed file is included or excluded on its own. */
  files?: RequestChangeFile[];
  /** A trace / perimeter row whose files could not be converted. */
  conversionFailed?: boolean;
};

type RequestChangesTableProps = {
  rows: RequestChangeRow[];
  /** when given, the files uploaded with the request (added, attached) get a rename action */
  onRenameFile?: (file: RequestChangeFile) => void;
  /** when given, the trace / perimeter rows get a « replace by a GeoJSON » action (key = role) */
  onReplaceGeometry?: (role: 'trace' | 'pdp') => void;
  /** when given, a trace / perimeter row whose conversion failed gets a « retry » action */
  onRetryConversion?: () => void;
} & ({ included: Set<string>; onIncludedChange: (included: Set<string>) => void } | { included?: undefined; onIncludedChange?: undefined });

const normalize = (value: unknown): string => (value === null || value === undefined || value === '' ? '' : String(value).trim());

const isFileChange = (file: RequestChangeFile) => file.status === 'added' || file.status === 'removed';

/** A row is a change when the proposed value differs from the current one, or when a document is added or removed. */
export const isRowChanged = (row: RequestChangeRow): boolean =>
  row.files?.some(isFileChange) || normalize(row.proposed) !== normalize(row.current);

/** Inclusion keys carried by a row: one per added or removed document, otherwise the row key for a changed value. */
export const changeKeys = (row: RequestChangeRow): string[] => {
  const fileKeys = (row.files ?? []).filter(isFileChange).map((file) => file.key);
  return fileKeys.length > 0 ? fileKeys : isRowChanged(row) ? [row.key] : [];
};

/** Human display of a payload or network value: booleans in French, empty values flagged. */
export const formatValue = (value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === '') {
    return <em className="text-gray-500">Non renseigné</em>;
  }
  if (typeof value === 'boolean') {
    return value ? 'Oui' : 'Non';
  }
  return String(value);
};

const fileStatusBadges: Record<RequestChangeFile['status'], React.ReactNode> = {
  added: (
    <Badge small severity="success" noIcon className="align-middle">
      Nouveau
    </Badge>
  ),
  attached: null,
  kept: null,
  removed: (
    <Badge small severity="warning" noIcon className="align-middle">
      Retiré
    </Badge>
  ),
  replaced: (
    <Badge small severity="info" noIcon className="align-middle">
      Remplacé
    </Badge>
  ),
};

const scanSeverity = (status: FileScanStatus) => (status === 'clean' ? 'success' : status === 'infected' ? 'error' : 'info');

/**
 * Classic table comparing each proposed value to the current network value.
 * In review mode (included + onIncludedChange), each change carries a checkbox to include or exclude it from the acceptance:
 * one per value row, one per added or removed document.
 */
function RequestChangesTable({
  rows,
  included,
  onIncludedChange,
  onRenameFile,
  onReplaceGeometry,
  onRetryConversion,
}: RequestChangesTableProps) {
  const selectable = included !== undefined;

  const toggle = (key: string, checked: boolean) => {
    if (!selectable) {
      return;
    }
    const next = new Set(included);
    if (checked) {
      next.add(key);
    } else {
      next.delete(key);
    }
    onIncludedChange(next);
  };

  return (
    <TableBasic bordered noScroll className="mb-0" tableClassName="text-sm">
      <thead>
        <tr>
          {selectable && <th className="w-12">Appliquer</th>}
          <th>Champ</th>
          <th>Valeur actuelle</th>
          <th>Valeur proposée</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const changed = isRowChanged(row);
          return (
            <tr key={row.key} className={cx(!changed && 'text-gray-500')}>
              {selectable && (
                <td className="text-center align-middle">
                  {changed && changeKeys(row).includes(row.key) && (
                    <InlineCheckbox
                      checked={included.has(row.key)}
                      disabled={row.locked}
                      label={`Appliquer ${row.label}`}
                      onChange={(checked) => toggle(row.key, checked)}
                    />
                  )}
                </td>
              )}
              <td className="font-medium">
                {row.label}
                {changed && (
                  <Badge small severity="info" noIcon className="ml-2 align-middle">
                    Modifié
                  </Badge>
                )}
              </td>
              <td className="whitespace-pre-line">
                {row.files && row.current === null ? (
                  <FileList files={row.files.filter((file) => file.status === 'kept' || file.status === 'removed')} />
                ) : (
                  formatValue(row.current)
                )}
              </td>
              <td className={cx('whitespace-pre-line', changed && 'font-semibold')}>
                {row.proposed !== null && <div className={cx(row.files && 'mb-1')}>{formatValue(row.proposed)}</div>}
                {row.files && (
                  <FileList files={row.files} proposed selected={selectable ? { included, toggle } : undefined} onRename={onRenameFile} />
                )}
                {onReplaceGeometry && (row.key === 'trace' || row.key === 'pdp') && (
                  <Button
                    size="small"
                    priority="tertiary"
                    iconId="fr-icon-upload-line"
                    className="mt-1"
                    onClick={() => onReplaceGeometry(row.key as 'trace' | 'pdp')}
                  >
                    Remplacer par un GeoJSON
                  </Button>
                )}
                {onRetryConversion && row.conversionFailed && (
                  <Button size="small" priority="tertiary" iconId="fr-icon-refresh-line" className="mt-1" onClick={onRetryConversion}>
                    Relancer la conversion
                  </Button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </TableBasic>
  );
}

export default RequestChangesTable;

type FileListProps = {
  files: RequestChangeFile[];
  /** the resulting list: removed files are struck through, added ones highlighted, each change with its checkbox */
  proposed?: boolean;
  selected?: { included: Set<string>; toggle: (key: string, checked: boolean) => void };
  onRename?: (file: RequestChangeFile) => void;
};

function FileList({ files, proposed, selected, onRename }: FileListProps) {
  if (files.length === 0) {
    return <em className="text-gray-500 font-normal">Aucun document</em>;
  }
  return (
    <ul className="mb-0 list-none p-0 flex flex-col gap-1 font-normal">
      {files.map((file) => {
        const isChange = proposed && (file.status === 'added' || file.status === 'removed');
        const downloadable =
          !file.purged && (file.scanStatus === undefined || file.scanStatus === 'clean' || file.scanStatus === 'skipped');
        return (
          <li key={file.key} className="flex flex-wrap items-center gap-2">
            {selected && isChange && (
              <InlineCheckbox
                checked={selected.included.has(file.key)}
                label={`${file.status === 'added' ? 'Ajouter' : 'Retirer'} ${file.filename}`}
                onChange={(checked) => selected.toggle(file.key, checked)}
              />
            )}
            <span
              className={cx(
                proposed && (file.status === 'removed' || file.status === 'replaced') && 'line-through text-gray-500',
                proposed && file.status === 'added' && 'font-semibold'
              )}
            >
              {downloadable ? (
                <a href={file.href} target="_blank" rel="noreferrer">
                  {file.filename}
                </a>
              ) : (
                file.filename
              )}{' '}
              <span className="text-gray-600">({formatFileSize(file.size)})</span>
              {file.purged && <span className="text-gray-600"> · contenu supprimé</span>}
            </span>
            {file.scanStatus && (
              <Badge small severity={scanSeverity(file.scanStatus)} noIcon className="align-middle">
                {fileScanStatusLabels[file.scanStatus]}
              </Badge>
            )}
            {proposed && fileStatusBadges[file.status]}
            {onRename && (file.status === 'added' || file.status === 'attached') && !file.purged && (
              <Button
                size="small"
                priority="tertiary"
                iconId="fr-icon-edit-line"
                title="Renommer le fichier"
                onClick={() => onRename(file)}
              >
                Renommer
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

type InlineCheckboxProps = {
  checked: boolean;
  disabled?: boolean;
  /** screen-reader label */
  label: string;
  onChange: (checked: boolean) => void;
};

/** Native checkbox in the DSFR accent colour: the DSFR component needs its fieldset layout and does not sit on a table line. */
function InlineCheckbox({ checked, disabled, label, onChange }: InlineCheckboxProps) {
  return (
    <input
      type="checkbox"
      className="size-4 shrink-0 cursor-pointer accent-(--background-action-high-blue-france) disabled:cursor-not-allowed"
      aria-label={label}
      title={label}
      checked={checked}
      disabled={disabled}
      onChange={(event) => onChange(event.target.checked)}
    />
  );
}
