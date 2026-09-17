import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDialogState } from '@/hooks/useDialogState';
import { getEmailBlockReasonLabel } from '@/modules/email/constants';
import { notify, toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

type EmailUnblockButtonProps = {
  email: string;
  reasonCode: string;
  /** Called after a successful unblock, to refresh the list the button lives in. */
  onUnblocked?: () => void | Promise<void>;
};

/**
 * Icon shortcut to unblock an address at Brevo, behind a confirmation.
 * Disabled when writes are off on this instance (the server would refuse anyway).
 */
function EmailUnblockButton({ email, reasonCode, onUnblocked }: EmailUnblockButtonProps) {
  const confirmDialog = useDialogState();
  const utils = trpc.useUtils();
  // One cached request per page (React Query dedupes it across rows).
  const { data: settings } = trpc.email.deliverability.getSettings.useQuery();
  const canUnblock = settings?.writesEnabled ?? false;
  const unblockContact = trpc.email.deliverability.unblockContact.useMutation();

  const handleUnblock = toastErrors(async () => {
    const result = await unblockContact.mutateAsync({ email });
    notify('success', result.wasBlocked ? 'Réception des emails réactivée' : "L'adresse n'était plus bloquée côté Brevo");
    await utils.email.deliverability.invalidate();
    await onUnblocked?.();
  });

  return (
    <>
      <Button
        size="small"
        priority="tertiary no outline"
        iconId="fr-icon-lock-unlock-line"
        title={canUnblock ? 'Réactiver la réception des emails côté Brevo' : 'Déblocage désactivé sur cette instance'}
        disabled={!canUnblock}
        stopPropagation
        onClick={() => confirmDialog.open()}
      />
      <ConfirmDialog
        control={confirmDialog}
        title="Réactiver la réception des emails"
        confirmLabel="Réactiver"
        confirmIconId="fr-icon-lock-unlock-line"
        onConfirm={handleUnblock}
      >
        <p className="m-0">
          Retirer <strong>{email}</strong> de la liste de blocage Brevo ? Les envois reprendront au prochain email.
        </p>
        <p className="m-0 mt-2 text-sm text-faded">Raison actuelle du blocage : {getEmailBlockReasonLabel(reasonCode)}.</p>
      </ConfirmDialog>
    </>
  );
}

export default EmailUnblockButton;
