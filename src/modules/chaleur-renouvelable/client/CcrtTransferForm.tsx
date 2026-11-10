import Alert from '@codegouvfr/react-dsfr/Alert';
import { useStore } from '@tanstack/react-form';
import type { z } from 'zod';

import Button from '@/components/ui/Button';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import { toastErrors } from '@/modules/notification';
import ReseauAutocomplete from '@/modules/reseaux/client/ReseauAutocomplete';
import trpc from '@/modules/trpc/client';

import { zCcrtTransferNetwork } from '../constants';
import { invalidateCcrtModeration } from './ccrt-demand-cache';

type CcrtTransferFormProps = { demandId: string; onClose: () => void };

/**
 * Preselects the closest heat network and reuses the existing network search.
 */
export function CcrtTransferForm({ demandId, onClose }: CcrtTransferFormProps) {
  const transfer = trpc.batEnr.admin.transferDemand.useMutation();
  const utils = trpc.useUtils();
  const defaultValues: z.input<typeof zCcrtTransferNetwork> = { demandId, networkId: undefined };
  const form = useAppForm({
    ...schemaValidation(zCcrtTransferNetwork),
    defaultValues,
    onSubmit: toastErrors(async () => {
      const selected = networkQuery.data?.network;
      if (!selected || networkQuery.isFetching || networkQuery.isError) {
        return;
      }
      await transfer.mutateAsync({ demandId, networkId: selected.id_fcu });
      await invalidateCcrtModeration(utils, demandId);
      onClose();
    }),
  });
  const networkId = useStore(form.store, (state) => state.values.networkId);
  const networkQuery = trpc.batEnr.admin.getTransferNetwork.useQuery({ demandId, networkId });
  const network = networkQuery.data?.network;
  return (
    <Form form={form} className="space-y-4">
      <p>La demande sera transmise au gestionnaire du réseau choisi et archivée dans cet espace. L’usager sera informé par email.</p>
      <label className="fr-label" htmlFor={`transfer-network-${demandId}`}>
        Rechercher un réseau par nom ou identifiant SNCU
      </label>
      <ReseauAutocomplete
        id={`transfer-network-${demandId}`}
        networkTypes={['reseau_de_chaleur']}
        onSelect={(selected) => form.setFieldValue('networkId', selected.id_fcu)}
      />
      {networkQuery.isFetching ? (
        <p role="status">Recherche du réseau et calcul de la distance…</p>
      ) : networkQuery.isError ? (
        <>
          <Alert severity="error" small description="Impossible de charger le réseau et sa distance." />
          <Button priority="tertiary" onClick={() => void networkQuery.refetch()}>
            Réessayer
          </Button>
        </>
      ) : network ? (
        <div className="border border-(--border-default-grey) p-3">
          <strong>{network.nom_reseau ?? 'Réseau sans nom'}</strong>
          <p className="mb-0">
            SNCU : {network.sncu_id ?? 'Non renseigné'} · {network.distance === null ? 'Distance inconnue' : `${network.distance} m`}
          </p>
        </div>
      ) : (
        <p>Aucun réseau avec tracé trouvé. Recherchez un réseau ci-dessus.</p>
      )}
      <div className="flex flex-wrap gap-3">
        <form.SubmitButton disabled={!network || networkQuery.isFetching || networkQuery.isError}>Confirmer le transfert</form.SubmitButton>
        <Button priority="tertiary" disabled={transfer.isPending} onClick={onClose}>
          Annuler
        </Button>
      </div>
    </Form>
  );
}
