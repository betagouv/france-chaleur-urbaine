import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Link from '@/components/ui/Link';
import type { DialogControl } from '@/hooks/useDialogState';
import { notify, toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

export type AcceptNetworkChangeRequestData = {
  id: string;
  included: string[];
  /** what the single decision button does, e.g. « Créer le réseau en construction » */
  actionLabel: string;
  networkLabel: string;
  /** the submitter is emailed that the elements are online (form requests publishing on the fiche or the map) */
  notifiedEmail: string | null;
  /** admin preview of that email */
  emailPreviewUrl: string;
};

type AcceptNetworkChangeRequestDialogProps = {
  control: DialogControl<AcceptNetworkChangeRequestData>;
};

/** Confirms the decision: the selected changes are applied right away and, when something is published, the submitter is emailed. */
function AcceptNetworkChangeRequestDialog({ control }: AcceptNetworkChangeRequestDialogProps) {
  const utils = trpc.useUtils();
  const acceptRequest = trpc.networkChangeRequests.admin.accept.useMutation();
  const data = control.data;
  const changes = data?.included.length ?? 0;

  const confirm = toastErrors(async () => {
    if (!data) {
      return;
    }
    await acceptRequest.mutateAsync({ id: data.id, included: data.included });
    notify('success', data.notifiedEmail ? `Demande traitée, email envoyé à ${data.notifiedEmail}` : 'Demande traitée');
    await Promise.all([
      utils.networkChangeRequests.admin.list.invalidate(),
      utils.networkChangeRequests.admin.countPending.invalidate(),
      utils.networkChangeRequests.admin.getReviewContext.invalidate(),
      utils.reseaux.reseauDeChaleur.list.invalidate(),
      utils.reseaux.reseauDeFroid.list.invalidate(),
      utils.reseaux.reseauEnConstruction.list.invalidate(),
      utils.reseaux.perimetreDeDeveloppementPrioritaire.list.invalidate(),
    ]);
    control.close();
  });

  return (
    <Dialog {...control.dialogProps} title={data?.actionLabel ?? ''} size="md">
      {data && (
        <>
          <p className="mb-2">
            Réseau : <strong>{data.networkLabel}</strong>.{' '}
            {changes > 0
              ? `${data.actionLabel} : ${changes} changement(s) appliqué(s) immédiatement, les autres restent tels quels.`
              : 'Aucun changement ne sera appliqué : la demande est simplement close.'}
          </p>
          <p className="mb-4 text-sm text-gray-600">
            {data.notifiedEmail ? (
              <>
                Un email de mise en ligne sera envoyé à {data.notifiedEmail} (
                <Link href={data.emailPreviewUrl} isExternal>
                  voir l'email
                </Link>
                ).
              </>
            ) : (
              'Aucun email ne sera envoyé au déposant.'
            )}
          </p>
          <Button iconId="fr-icon-check-line" loading={acceptRequest.isPending} onClick={confirm}>
            {data.actionLabel}
          </Button>
        </>
      )}
    </Dialog>
  );
}

export default AcceptNetworkChangeRequestDialog;
