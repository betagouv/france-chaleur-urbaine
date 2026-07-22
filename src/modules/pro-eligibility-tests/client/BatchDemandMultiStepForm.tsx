import { useStore } from '@tanstack/react-form';
import { useMemo } from 'react';
import { z } from 'zod';

import DemandContactFields from '@/components/EligibilityForm/components/DemandContactFields';
import Alert from '@/components/ui/Alert';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import { trackPostHogEvent } from '@/modules/analytics/client';
import { useAuthentication } from '@/modules/auth/client/hooks';
import { type BatchDemandContactInfo, zCreateBatchDemandInput } from '@/modules/demands/constants';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import trpc from '@/modules/trpc/client';

const MAX_BATCH_DEMAND_ADDRESSES = 50;
const emptyDedicatedContact: BatchDemandContactInfo = {
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

type BatchDemandFormProps = {
  testId: string;
  addresses: AddressData[];
  onSuccess: () => void;
};

/**
 * Batch demand creation form from a pro eligibility test: heating type/energy per
 * address, optional dedicated contact (admin only) and terms of use.
 */
export const BatchDemandMultiStepForm = ({ testId, addresses, onSuccess }: BatchDemandFormProps) => {
  const { hasRole } = useAuthentication();
  const isAdmin = hasRole('admin');
  const addressesWithExistingDemand = useMemo(() => addresses.filter((addr) => addr.demand_id), [addresses]);
  const filteredAddresses = useMemo(() => addresses.filter((addr) => !addr.demand_id), [addresses]);
  const activeAddresses = useMemo(() => filteredAddresses.slice(0, MAX_BATCH_DEMAND_ADDRESSES), [filteredAddresses]);
  const limitReached = filteredAddresses.length > MAX_BATCH_DEMAND_ADDRESSES;

  const { mutateAsync, isError } = trpc.demands.user.createBatch.useMutation({});

  const defaultValues = useMemo<z.input<typeof batchDemandFormSchema>>(
    () => ({
      addresses: activeAddresses.map((addr) => ({
        addressId: addr.id,
        heatingEnergy: undefined as unknown as 'électricité' | 'gaz' | 'fioul' | 'autre',
        heatingType: undefined as unknown as 'collectif' | 'individuel',
      })),
      commentUser: '',
      contact: undefined,
      termOfUse: false,
      useDedicatedContact: false,
    }),
    [activeAddresses]
  );

  const form = useAppForm({
    ...schemaValidation(batchDemandFormSchema),
    defaultValues,
    onSubmit: async ({ value }) => {
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
  });
  const useDedicatedContact = useStore(form.store, (state) => state.values.useDedicatedContact);

  return (
    <Form form={form}>
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
                <form.AppField name={`addresses[${index}].heatingType`}>
                  {(field) => (
                    <field.RadioField
                      label="Type"
                      orientation="horizontal"
                      small
                      className="mb-0!"
                      options={[
                        { label: 'Collectif', nativeInputProps: { value: 'collectif' } },
                        { label: 'Individuel', nativeInputProps: { value: 'individuel' } },
                      ]}
                    />
                  )}
                </form.AppField>
                <form.AppField name={`addresses[${index}].heatingEnergy`}>
                  {(field) => (
                    <field.RadioField
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
                  )}
                </form.AppField>
              </div>
            </div>
          ))}
        </div>
        {isAdmin && (
          <Alert className="fr-mb-0" variant="info">
            <div className="flex flex-col gap-3">
              <form.AppField
                name="useDedicatedContact"
                listeners={{
                  // the contact subtree only exists (and gets validated) when the option is enabled;
                  // set synchronously so the field group never mounts on an undefined subtree
                  onChange: ({ value }) => {
                    form.setFieldValue('contact', value ? (form.getFieldValue('contact') ?? emptyDedicatedContact) : undefined);
                  },
                }}
              >
                {(field) => <field.CheckboxField label="Créer les demandes pour un contact dédié" />}
              </form.AppField>
              {useDedicatedContact && <DemandContactFields form={form} fields="contact" structureClassName="fr-mt-0" />}
            </div>
          </Alert>
        )}
        <form.AppField name="commentUser">
          {(field) => (
            <field.TextareaField
              label="Si besoin, vous pouvez ajouter ici toute autre information utile liée à votre projet"
              nativeTextAreaProps={{ rows: 4 }}
            />
          )}
        </form.AppField>
        <form.AppField name="termOfUse">
          {(field) => (
            <field.CheckboxField
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
          )}
        </form.AppField>

        {isError && (
          <div className="text-error">
            Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
          </div>
        )}

        <div className="flex gap-4">
          <form.SubmitButton className="fr-btn">Être mis en relation pour {activeAddresses.length} adresses</form.SubmitButton>
        </div>
      </div>
    </Form>
  );
};
