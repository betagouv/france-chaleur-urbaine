import { skipToken } from '@tanstack/react-query';

import AsyncButton from '@/components/ui/AsyncButton';
import Button from '@/components/ui/Button';
import Dialog from '@/components/ui/Dialog';
import Loader from '@/components/ui/Loader';
import Notice from '@/components/ui/Notice';
import type { DeleteNetworkInput } from '@/modules/reseaux/constants';
import trpc from '@/modules/trpc/client';

export type NetworkToDelete = {
  id: number;
  type: DeleteNetworkInput['type'];
  name: string;
};

type DeleteNetworkDialogProps = {
  network: NetworkToDelete | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Confirmation de suppression d'un réseau. Avertit quand des utilisateurs sont liés au réseau
 * via leurs permissions : à la confirmation, le serveur supprime aussi ces permissions devenues incohérentes.
 */
export default function DeleteNetworkDialog({ network, onClose, onConfirm }: DeleteNetworkDialogProps) {
  const { data: linkedUsers, isFetching } = trpc.reseaux.getNetworkLinkedUsers.useQuery(
    network ? { id: network.id, type: network.type } : skipToken
  );

  return (
    <Dialog
      title="Supprimer le réseau"
      size="md"
      open={!!network}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      {network && (
        <div className="flex flex-col gap-4">
          <p className="mb-0">
            Êtes-vous sûr de vouloir supprimer <strong>{network.name}</strong> ? Cette action marquera le réseau comme supprimé et sera
            effective à la prochaine synchronisation.
          </p>

          {isFetching && <Loader size="sm" />}

          {!isFetching && linkedUsers && linkedUsers.length > 0 && (
            <div className="flex flex-col gap-2">
              <Notice variant="warning" size="sm">
                {linkedUsers.length > 1
                  ? `${linkedUsers.length} utilisateurs sont liés à ce réseau via leurs permissions. En confirmant, ces permissions seront retirées.`
                  : '1 utilisateur est lié à ce réseau via ses permissions. En confirmant, cette permission sera retirée.'}
              </Notice>
              <ul className="list-disc pl-6 mb-0 text-sm">
                {linkedUsers.map((u) => (
                  <li key={u.id}>{u.email}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button priority="tertiary" onClick={onClose}>
              Annuler
            </Button>
            <AsyncButton priority="primary" variant="destructive" iconId="fr-icon-delete-line" disabled={isFetching} onClick={onConfirm}>
              Supprimer
            </AsyncButton>
          </div>
        </div>
      )}
    </Dialog>
  );
}
