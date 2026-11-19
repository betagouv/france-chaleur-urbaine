import Alert from '@codegouvfr/react-dsfr/Alert';

import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useDialogState } from '@/hooks/useDialogState';
import trpc from '@/modules/trpc/client';
import { dayjs } from '@/utils/date';

import type { CcrtDemand } from '../types';
import { invalidateCcrtModeration } from './ccrt-demand-cache';

type CcrtDemandReopeningProps = { demand: CcrtDemand; full?: boolean };

/**
 * Confirms a return to moderation with the latest CCRT status changes visible to the admin.
 */
export function CcrtDemandReopening({ demand, full }: CcrtDemandReopeningProps) {
  const dialog = useDialogState();
  const reopen = trpc.batEnr.admin.reopenDemand.useMutation();
  const utils = trpc.useUtils();
  const lastChange = demand.last_ccrt_status_change;
  return (
    <>
      <Button priority="tertiary" size="small" full={full} onClick={() => dialog.open()}>
        Remettre à valider
      </Button>
      <ConfirmDialog
        control={dialog}
        size="md"
        title="Remettre la demande à valider"
        confirmLabel="Remettre à valider"
        onConfirm={async () => {
          try {
            await reopen.mutateAsync({ demandId: demand.id, updatedAt: demand.updated_at });
          } finally {
            await invalidateCcrtModeration(utils, demand.id);
          }
        }}
      >
        <p>La demande reviendra dans « À valider » et ne sera plus visible des CCRT jusqu’à sa revalidation. Aucun email ne sera envoyé.</p>
        <p>Son statut de suivi, son affectation, ses notes et ses emails seront conservés.</p>
        <p>
          Statut conservé : <strong>{demand.status}</strong>.
        </p>
        {lastChange && (
          <Alert
            severity="warning"
            small
            description={`Un CCRT a déjà modifié le statut de cette demande : ${lastChange.status} le ${dayjs(lastChange.date).format('DD/MM/YYYY à HH:mm')}. Vous pouvez tout de même la remettre à valider.`}
          />
        )}
      </ConfirmDialog>
    </>
  );
}
