import { useState } from 'react';

import Alert from '@/components/ui/Alert';
import AsyncButton from '@/components/ui/AsyncButton';
import Dialog from '@/components/ui/Dialog';
import type { DialogControl } from '@/hooks/useDialogState';
import { notify } from '@/modules/notification';
import trpc from '@/modules/trpc/client';
import type { BulkAddTagsResult } from '@/modules/users/server/tags-service';

import TagsCombobox from './TagsCombobox';

type BulkTagDialogProps = {
  control: DialogControl;
  onSuccess: () => void;
};

/**
 * Bulk-assigns catalog tags to users pasted as an email list. Tags are added on top of each user's
 * existing tags (never replaced). The run result — added assignments, matched users, unknown emails —
 * is shown inline so the admin can spot typos without losing the list.
 */
const BulkTagDialog = ({ control, onSuccess }: BulkTagDialogProps) => {
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [emailsText, setEmailsText] = useState('');
  const [result, setResult] = useState<BulkAddTagsResult | null>(null);

  const addToUsers = trpc.users.adminTags.addToUsers.useMutation();

  const emails = parseEmails(emailsText);
  const canSubmit = tagIds.length > 0 && emails.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    const res = await addToUsers.mutateAsync({ emails, tagIds });
    setResult(res);
    onSuccess();
    if (res.assignmentsAdded > 0) {
      notify('success', `${pluralize(res.assignmentsAdded, 'affectation ajoutée', 'affectations ajoutées')}`);
    }
  };

  const dialogProps = {
    ...control.dialogProps,
    onOpenChange: (open: boolean) => {
      control.dialogProps.onOpenChange(open);
      if (!open) {
        setTagIds([]);
        setEmailsText('');
        setResult(null);
      }
    },
  };

  return (
    <Dialog {...dialogProps} title="Étiqueter des utilisateurs en masse" size="md">
      <div className="flex flex-col gap-4">
        <div className="fr-input-group">
          <div className="fr-label mb-1">Étiquettes à ajouter</div>
          <TagsCombobox value={tagIds} onChange={setTagIds} />
        </div>

        <div className="fr-input-group">
          <label className="fr-label" htmlFor="bulk-tag-emails">
            Emails des utilisateurs
            <span className="fr-hint-text">Un email par ligne. Les comptes inconnus sont ignorés.</span>
          </label>
          <textarea
            id="bulk-tag-emails"
            className="fr-input"
            rows={8}
            value={emailsText}
            onChange={(event) => setEmailsText(event.target.value)}
            placeholder={'jean.dupont@example.com\nmarie.martin@example.com'}
          />
          {emails.length > 0 && <p className="fr-hint-text mt-1">{pluralize(emails.length, 'email détecté', 'emails détectés')}</p>}
        </div>

        {result && (
          <div className="flex flex-col gap-2">
            <Alert size="sm" variant={result.assignmentsAdded > 0 ? 'success' : 'info'}>
              {result.assignmentsAdded > 0
                ? `${pluralize(result.assignmentsAdded, 'affectation ajoutée', 'affectations ajoutées')} à ${pluralize(result.matchedUserCount, 'utilisateur')}.`
                : result.matchedUserCount > 0
                  ? 'Ces utilisateurs portaient déjà les étiquettes sélectionnées.'
                  : 'Aucun utilisateur correspondant.'}
            </Alert>
            {result.notFoundEmails.length > 0 && (
              <Alert size="sm" variant="warning">
                {pluralize(result.notFoundEmails.length, 'email sans compte')} :{' '}
                <span className="break-all">{result.notFoundEmails.join(', ')}</span>
              </Alert>
            )}
          </div>
        )}

        <div className="flex justify-end">
          <AsyncButton priority="primary" iconId="ri-price-tag-3-line" disabled={!canSubmit} onClick={handleSubmit}>
            Ajouter aux utilisateurs
          </AsyncButton>
        </div>
      </div>
    </Dialog>
  );
};

/** One email per line, normalized and deduplicated. */
const parseEmails = (raw: string): string[] => [
  ...new Set(
    raw
      .split('\n')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  ),
];

const pluralize = (count: number, singular: string, plural = `${singular}s`) => `${count} ${count > 1 ? plural : singular}`;

export default BulkTagDialog;
