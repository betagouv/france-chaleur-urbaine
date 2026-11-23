import Alert from '@codegouvfr/react-dsfr/Alert';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import { useStore } from '@tanstack/react-form';
import type { z } from 'zod';

import Button from '@/components/ui/Button';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import ReseauAutocomplete from '@/modules/reseaux/client/ReseauAutocomplete';
import trpc from '@/modules/trpc/client';

import { zCcrtTransferForm } from '../constants';
import { invalidateCcrtModeration } from './ccrt-demand-cache';

type CcrtTransferFormProps = { demandId: string; onClose: () => void };

/**
 * Preselects the closest heat network and reuses the existing network search.
 */
export function CcrtTransferForm({ demandId, onClose }: CcrtTransferFormProps) {
  const transfer = trpc.batEnr.admin.transferDemand.useMutation();
  const utils = trpc.useUtils();
  const defaultValues: z.input<typeof zCcrtTransferForm> = { demandId, managerMessage: '', networkId: undefined };
  const form = useAppForm({
    ...schemaValidation(zCcrtTransferForm),
    defaultValues,
    onSubmit: async ({ value }) => {
      const selected = networkQuery.data?.network;
      if (!selected || networkQuery.isFetching || networkQuery.isError) {
        return;
      }
      await transfer.mutateAsync({ demandId, managerMessage: value.managerMessage, networkId: selected.id_fcu });
      await invalidateCcrtModeration(utils, demandId);
      onClose();
    },
  });
  const networkId = useStore(form.store, (state) => state.values.networkId);
  const networkQuery = trpc.batEnr.admin.getTransferNetwork.useQuery({ demandId, networkId });
  const network = networkQuery.data?.network;
  return (
    <Form form={form} className="space-y-4">
      <Alert
        severity="info"
        small
        description="La demande sera transmise au gestionnaire du réseau choisi et archivée dans cet espace. Un email informera l’usager du transfert."
      />
      <h3 className="mb-0 text-lg">Gestionnaire de réseau destinataire</h3>
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
        <RadioButtons
          legend="Réseau sélectionné"
          className="border border-(--border-active-blue-france) p-3"
          options={[
            {
              hintText: `SNCU : ${network.sncu_id ?? 'Non renseigné'} · ${network.distance === null ? 'Distance inconnue' : `${network.distance} m`}`,
              label: network.nom_reseau ?? 'Réseau sans nom',
              nativeInputProps: {
                checked: true,
                name: `transfer-network-${demandId}`,
                onChange: () => form.setFieldValue('networkId', network.id_fcu),
                value: network.id_fcu,
              },
            },
          ]}
        />
      ) : (
        <p>Aucun réseau avec tracé trouvé. Recherchez un réseau ci-dessus.</p>
      )}
      <form.AppField name="managerMessage">{(field) => <field.TextareaField label="Message au gestionnaire" />}</form.AppField>
      <div className="flex flex-wrap justify-end gap-3">
        <Button priority="secondary" disabled={transfer.isPending} onClick={onClose}>
          Annuler
        </Button>
        <form.SubmitButton disabled={!network || networkQuery.isFetching || networkQuery.isError}>Transférer la demande</form.SubmitButton>
      </div>
    </Form>
  );
}
