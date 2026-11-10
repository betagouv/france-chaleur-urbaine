import { useMemo, useState } from 'react';
import { z } from 'zod';

import Alert from '@/components/ui/Alert';
import AsyncButton from '@/components/ui/AsyncButton';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import TableSimple, { type ColumnDef } from '@/components/ui/table/TableSimple';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { notify, toastErrors } from '@/modules/notification';
import trpc, { type RouterOutput } from '@/modules/trpc/client';

const MIN_NOTICE_DAYS = 15;

const zAnnounceForm = z.object({
  deletionDate: z.iso
    .date('Veuillez saisir une date')
    .refine((date) => new Date(date).getTime() >= Date.now() + MIN_NOTICE_DAYS * 24 * 3600 * 1000, {
      message: `La date doit être au moins ${MIN_NOTICE_DAYS} jours après aujourd'hui`,
    }),
});

type PhaseOutAccount = RouterOutput['users']['particulierPhaseOut']['getStatus']['accounts'][number];

/**
 * Temporary admin screen of the particulier accounts phase-out: active accounts, their announcement state,
 * and the confirmed sending of the deletion announcement to those not yet notified (resumable).
 */
export function ParticulierPhaseOutPanel() {
  const utils = trpc.useUtils();
  const { data: status, isLoading } = trpc.users.particulierPhaseOut.getStatus.useQuery();
  const announce = trpc.users.particulierPhaseOut.announceDeletion.useMutation();
  const [pendingDate, setPendingDate] = useState<string | null>(null);

  const form = useAppForm({
    ...schemaValidation(zAnnounceForm),
    defaultValues: { deletionDate: '' },
    onSubmit: ({ value }) => setPendingDate(value.deletionDate),
  });

  const handleConfirm = toastErrors(async () => {
    if (!pendingDate) {
      return;
    }
    const result = await announce.mutateAsync({ deletionDate: pendingDate });
    notify('success', `Email d'annonce envoyé à ${result.sentCount} compte(s)`);
    setPendingDate(null);
    await utils.users.particulierPhaseOut.getStatus.invalidate();
  });

  const columns: ColumnDef<PhaseOutAccount>[] = useMemo(
    () => [
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'announced_at', cellType: 'Date', header: 'Annonce envoyée le', width: '180px' },
      { accessorKey: 'email_blocked_reason', header: 'Blocage Brevo', width: '220px' },
    ],
    []
  );

  if (isLoading || !status) {
    return <Text>Chargement…</Text>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Text className="mb-0">
        <strong>{status.accounts.length}</strong> compte(s) particulier(s) actif(s), dont <strong>{status.announcedCount}</strong> déjà
        prévenu(s) et <strong>{status.toAnnounceCount}</strong> à prévenir. L'email{' '}
        <Link href="/admin/emails?type=auth.utilisateur.suppression-compte-particulier">Suppression du compte particulier (annonce)</Link>{' '}
        est envoyé uniquement aux comptes pas encore prévenus : relancer après un incident reprend là où l'envoi s'est arrêté. Les adresses
        bloquées côté Brevo ne le recevront pas.
      </Text>

      <Form form={form} className="flex flex-wrap items-end gap-4">
        <form.AppField name="deletionDate">
          {(field) => (
            <field.TextField
              label="Date de suppression annoncée"
              hintText={`Au moins ${MIN_NOTICE_DAYS} jours après l'envoi`}
              className="mb-0!"
              nativeInputProps={{ type: 'date' }}
            />
          )}
        </form.AppField>
        <form.SubmitButton disabled={status.toAnnounceCount === 0} iconId="fr-icon-mail-line">
          Envoyer l'annonce à {status.toAnnounceCount} compte(s)
        </form.SubmitButton>
      </Form>

      <TableSimple
        columns={columns}
        data={status.accounts}
        enableGlobalFilter
        padding="sm"
        initialSortingState={[{ desc: false, id: 'email' }]}
      />

      <Dialog title="Confirmer l'envoi" size="md" open={pendingDate !== null} onOpenChange={(open) => !open && setPendingDate(null)}>
        {pendingDate && (
          <div className="flex flex-col gap-4">
            <Alert variant="warning" size="sm">
              {status.toAnnounceCount} compte(s) vont recevoir l'annonce d'une suppression le{' '}
              <strong>{new Date(pendingDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
              Cette date doit ensuite être tenue avec la commande de suppression.
            </Alert>
            <div className="flex justify-end gap-2">
              <Button priority="secondary" onClick={() => setPendingDate(null)}>
                Annuler
              </Button>
              <AsyncButton iconId="fr-icon-mail-line" onClick={handleConfirm}>
                Envoyer
              </AsyncButton>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
