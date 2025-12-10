import { useMemo } from 'react';
import useForm from '@/components/form/react-form/useForm';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import { type BatchDemandAddressData, zCreateBatchDemandInput } from '@/modules/demands/constants';
import trpc from '@/modules/trpc/client';

const MAX_BATCH_DEMAND_ADDRESSES = 50;

type AddressData = {
  id: string;
  ban_address: string | null;
  demand_id?: string | null;
};

interface BatchDemandFormProps {
  addresses: AddressData[];
  onSuccess: () => void;
}

export const BatchDemandMultiStepForm = ({ addresses, onSuccess }: BatchDemandFormProps) => {
  const filteredAddresses = useMemo(() => addresses.filter((addr) => !addr.demand_id), [addresses]);
  const activeAddresses = useMemo(() => filteredAddresses.slice(0, MAX_BATCH_DEMAND_ADDRESSES), [filteredAddresses]);
  const limitReached = filteredAddresses.length > MAX_BATCH_DEMAND_ADDRESSES;

  const { mutateAsync, isPending, isError } = trpc.demands.user.createBatch.useMutation({});

  const defaultValues = useMemo(
    () => ({
      addresses: activeAddresses.map((addr) => ({
        addressId: addr.id,
        heatingEnergy: undefined as unknown as 'électricité' | 'gaz' | 'fioul' | 'autre',
        heatingType: undefined as unknown as 'collectif' | 'individuel',
      })),
      termOfUse: false,
    }),
    [activeAddresses]
  );

  const { Form, Field, Submit } = useForm({
    defaultValues,
    onSubmit: async ({ value }: { value: { addresses: BatchDemandAddressData[]; termOfUse: boolean } }) => {
      await mutateAsync({ addresses: value.addresses, termOfUse: value.termOfUse });
      onSuccess();
    },
    schema: zCreateBatchDemandInput,
  });

  return (
    <Form>
      <div className="flex flex-col gap-4">
        {limitReached && (
          <CallOut variant="warning">
            Afin de garantir le bon traitement de vos demandes, nous avons limité le nombre d'adresses à {MAX_BATCH_DEMAND_ADDRESSES}.
          </CallOut>
        )}

        <p className="text-sm text-faded">
          Sélectionnez le type de chauffage pour chacune des <strong>{activeAddresses.length}</strong> adresses.
        </p>

        <div className="flex flex-col gap-2">
          {activeAddresses.map((addr, index) => (
            <div key={addr.id} className="flex flex-col gap-2 p-3 border rounded bg-gray-50">
              <span className="text-sm font-medium truncate" title={addr.ban_address || ''}>
                {index + 1}. {addr.ban_address}
              </span>
              <div className="flex items-center gap-6">
                <Field.Radio
                  name={`addresses[${index}].heatingType`}
                  label="Type"
                  orientation="horizontal"
                  small
                  className="!mb-0"
                  options={[
                    { label: 'Collectif', nativeInputProps: { value: 'collectif' } },
                    { label: 'Individuel', nativeInputProps: { value: 'individuel' } },
                  ]}
                />
                <Field.Radio
                  name={`addresses[${index}].heatingEnergy`}
                  label="Énergie"
                  orientation="horizontal"
                  small
                  className="!mb-0"
                  options={[
                    { label: 'Gaz', nativeInputProps: { value: 'gaz' } },
                    { label: 'Fioul', nativeInputProps: { value: 'fioul' } },
                    { label: 'Électricité', nativeInputProps: { value: 'électricité' } },
                    { label: 'Autre', nativeInputProps: { value: 'autre' } },
                  ]}
                />
              </div>
            </div>
          ))}
        </div>

        <Field.Checkbox
          name="termOfUse"
          label={
            <>
              J'accepte d'être contacté dans le cadre de ma demande et j'accepte que mes informations soient conservées et traitées par
              France Chaleur Urbaine, conformément à{' '}
              <Link href="/politique-de-confidentialite" isExternal>
                notre politique de protection des données personnelles
              </Link>
              .
            </>
          }
        />

        {isError && (
          <div className="text-error">
            Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
          </div>
        )}

        <div className="flex gap-4">
          <Submit className="fr-btn" disabled={isPending}>
            {isPending ? 'Création en cours...' : `Créer les ${activeAddresses.length} demandes`}
          </Submit>
        </div>
      </div>
    </Form>
  );
};
