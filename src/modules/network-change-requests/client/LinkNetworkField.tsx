import { useState } from 'react';

import Button from '@/components/ui/Button';
import { notify, toastErrors } from '@/modules/notification';
import ReseauAutocomplete from '@/modules/reseaux/client/ReseauAutocomplete';
import type { NetworkType } from '@/modules/reseaux/constants';
import trpc from '@/modules/trpc/client';

type LinkNetworkFieldProps = {
  requestId: string;
  /** a request already attached shows a « Changer » button; an unattached one shows the search right away */
  hasNetwork: boolean;
  /** kinds applied on a heat network only accept those (a construction network would be refused at acceptance) */
  networkTypes?: NetworkType[];
};

/**
 * Attaches a pending request to a network of the base (heat or construction network: the search does not list cold
 * networks yet), or changes the attached one. Required before a request can be applied when the submitter's network was
 * not recognized.
 */
function LinkNetworkField({ requestId, hasNetwork, networkTypes }: LinkNetworkFieldProps) {
  const utils = trpc.useUtils();
  const linkNetwork = trpc.networkChangeRequests.admin.linkNetwork.useMutation();
  const [editing, setEditing] = useState(false);

  const update = toastErrors(async (network: { id: number; type: 'reseau_de_chaleur' | 'reseau_en_construction' }) => {
    await linkNetwork.mutateAsync({ id: requestId, network });
    await Promise.all([
      utils.networkChangeRequests.admin.list.invalidate(),
      utils.networkChangeRequests.admin.getReviewContext.invalidate({ id: requestId }),
    ]);
    setEditing(false);
    notify('success', 'Demande rattachée au réseau');
  });

  if (hasNetwork && !editing) {
    return (
      <Button size="small" priority="tertiary" iconId="fr-icon-edit-line" className="ml-2" onClick={() => setEditing(true)}>
        Changer
      </Button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <ReseauAutocomplete
        networkTypes={networkTypes}
        className="flex-1"
        placeholder="Rattacher à un réseau (nom ou identifiant SNCU)"
        onSelect={(network) => void update({ id: network.id_fcu, type: network.network_type })}
      />
      {hasNetwork && (
        <Button size="small" priority="tertiary" onClick={() => setEditing(false)}>
          Annuler
        </Button>
      )}
    </div>
  );
}

export default LinkNetworkField;
