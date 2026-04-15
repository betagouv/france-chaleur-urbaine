import { useState } from 'react';

import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import { toastErrors } from '@/modules/notification';
import trpc from '@/modules/trpc/client';

type NetworkChangeRequestDialogProps = {
  demandId: string;
};

const NetworkChangeRequestDialog = ({ demandId }: NetworkChangeRequestDialogProps) => {
  const [open, setOpen] = useState(false);
  const [sncuId, setSncuId] = useState('');
  const [reason, setReason] = useState('');

  const mutation = trpc.demands.territory.requestNetworkChange.useMutation({
    onSuccess: () => {
      setOpen(false);
      setSncuId('');
      setReason('');
    },
  });

  const handleSubmit = async () => {
    await toastErrors(async () => {
      await mutation.mutateAsync({ demandId, reason, requestedSncuId: sncuId });
    });
  };

  return (
    <>
      <Button
        size="small"
        priority="tertiary"
        iconId="ri-exchange-line"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        title="Demander un changement de réseau"
      >
        Changer le réseau
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Demander un changement de réseau"
        description="Cette demande sera transmise à l'équipe FCU pour validation."
        size="md"
      >
        <div className="space-y-4">
          <div className="fr-input-group">
            <label className="fr-label" htmlFor="sncu-id">
              Identifiant SNCU du réseau souhaité
            </label>
            <input
              className="fr-input"
              id="sncu-id"
              type="text"
              placeholder="Ex: 7501C"
              value={sncuId}
              onChange={(e) => setSncuId(e.target.value)}
            />
          </div>

          <div className="fr-input-group">
            <label className="fr-label" htmlFor="reason">
              Motif de la demande
            </label>
            <textarea
              className="fr-input"
              id="reason"
              rows={3}
              placeholder="Expliquez pourquoi le réseau actuel ne convient pas..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button priority="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!sncuId.trim() || !reason.trim() || mutation.isPending}>
              {mutation.isPending ? 'Envoi...' : 'Envoyer la demande'}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
};

export default NetworkChangeRequestDialog;
