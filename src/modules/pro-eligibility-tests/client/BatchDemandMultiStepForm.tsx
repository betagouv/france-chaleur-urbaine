import { useEffect, useMemo } from 'react';
import { z } from 'zod';

import DemandContactFields from '@/components/EligibilityForm/components/DemandContactFields';
import useForm from '@/components/form/react-form/useForm';
import Alert from '@/components/ui/Alert';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { useAuthentication } from '@/modules/auth/client/hooks';
import { type BatchDemandAddressData, type BatchDemandContactInfo, zCreateBatchDemandInput } from '@/modules/demands/constants';
import trpc from '@/modules/trpc/client';

const MAX_BATCH_DEMAND_ADDRESSES = 50;
const emptyDedicatedContact: BatchDemandContactInfo = {
  commentUser: '',
  company: '',
  companyType: '',
  demandArea: undefined,
  demandCompanyName: '',
  demandCompanyType: '',
  email: '',
  firstName: '',
  lastName: '',
  nbLogements: undefined,
  phone: '',
  structure: '',
};
const batchDemandFormSchema = zCreateBatchDemandInput.extend({
  useDedicatedContact: z.boolean().optional(),
});

type AddressData = {
  id: string;
  ban_address: string | null;
  demand_id?: string | null;
};

interface BatchDemandFormProps {
  testId: string;
  addresses: AddressData[];
  onSuccess: () => void;
}

export const BatchDemandMultiStepForm = ({ testId, addresses, onSuccess }: BatchDemandFormProps) => {
  const { hasRole } = useAuthentication();
  const isAdmin = hasRole('admin');
  const addressesWithExistingDemand = useMemo(() => addresses.filter((addr) => addr.demand_id), [addresses]);
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
      commentUser: '',
      contact: undefined as BatchDemandContactInfo | undefined,
      termOfUse: false,
      useDedicatedContact: false,
    }),
    [activeAddresses]
  );

  const { form, Form, Field, Fieldset, FieldsetLegend, FieldWrapper, Submit, useValue } = useForm({
    defaultValues,
    onSubmit: async ({
      value,
    }: {
      value: {
        addresses: BatchDemandAddressData[];
        commentUser: string;
        contact?: BatchDemandContactInfo;
        termOfUse: boolean;
        useDedicatedContact: boolean;
      };
    }) => {
      trackPostHogEvent('bulk_test:contact_request_submitted', {
        bulk_test_id: testId,
        has_phone: value.contact?.phone !== '',
        professional_type: value.contact?.structure,
        selected_rows_count: value.addresses.length,
      });
      await mutateAsync({
        addresses: value.addresses,
        commentUser: value.commentUser,
        contact: isAdmin && value.useDedicatedContact ? value.contact : undefined,
        termOfUse: value.termOfUse,
      });
      onSuccess();
    },
    schema: batchDemandFormSchema,
  });
  const companyType = useValue<string | undefined>('contact.companyType');
  const demandCompanyType = useValue<string | undefined>('contact.demandCompanyType');
  const structure = useValue<string | undefined>('contact.structure');
  const useDedicatedContact = useValue<boolean>('useDedicatedContact');
  const contactState = {
    companyType,
    demandCompanyType,
    structure,
  };
  const formUi = { Field, Fieldset, FieldsetLegend, FieldWrapper, form };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    if (!useDedicatedContact) {
      form.setFieldValue('contact', undefined);
      return;
    }

    const currentContact = form.getFieldValue('contact');
    if (!currentContact) {
      form.setFieldValue('contact', emptyDedicatedContact);
    }
  }, [form, isAdmin, useDedicatedContact]);

  return (
    <Form>
      <div className="flex flex-col gap-4">
        {addressesWithExistingDemand.length > 0 && (
          <CallOut variant="info">
            {addressesWithExistingDemand.length} adresse{addressesWithExistingDemand.length > 1 ? 's ont' : ' a'} déjà une demande de
            raccordement et {addressesWithExistingDemand.length > 1 ? 'ont été retirées' : 'a été retirée'} de la sélection.
          </CallOut>
        )}
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
                  className="mb-0!"
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
                  className="mb-0!"
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
        {isAdmin && (
          <Alert className="fr-mb-0" variant="info">
            <div className="flex flex-col gap-3">
              <Field.Checkbox name="useDedicatedContact" label="Créer les demandes pour un contact dédié" />
              {useDedicatedContact && (
                <DemandContactFields contactState={contactState} formUi={formUi} namePrefix="contact." structureClassName="fr-mt-0" />
              )}
            </div>
          </Alert>
        )}
        <Field.Textarea
          label="Si besoin, vous pouvez ajouter ici toute autre information utile liée à votre projet"
          name="commentUser"
          nativeTextAreaProps={{
            rows: 4,
          }}
        />
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
            {isPending ? 'Création en cours...' : `Être mis en relation pour ${activeAddresses.length} adresses`}
          </Submit>
        </div>
      </div>
    </Form>
  );
};
