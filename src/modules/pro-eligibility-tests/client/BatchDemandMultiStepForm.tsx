import Stepper from '@codegouvfr/react-dsfr/Stepper';
import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import useForm from '@/components/form/react-form/useForm';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import {
  type BatchDemandStep1Data,
  type BatchDemandStep2AddressData,
  fieldLabelInformation,
  zBatchDemandStep1Schema,
  zBatchDemandStep2Schema,
} from '@/modules/demands/constants';
import trpc from '@/modules/trpc/client';
import { pick } from '@/utils/objects';

const MAX_BATCH_DEMAND_ADDRESSES = 50;

const zStep2FormSchema = z.object({
  addresses: zBatchDemandStep2Schema,
});

type AddressData = {
  id: string;
  ban_address: string | null;
  demand_id?: string | null;
};

interface BatchDemandMultiStepFormProps {
  addresses: AddressData[];
  onSuccess: () => void;
}

export const BatchDemandMultiStepForm = ({ addresses, onSuccess }: BatchDemandMultiStepFormProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [commonData, setCommonData] = useState<BatchDemandStep1Data>();

  const filteredAddresses = useMemo(() => addresses.filter((addr) => !addr.demand_id), [addresses]);
  const activeAddresses = useMemo(() => filteredAddresses.slice(0, MAX_BATCH_DEMAND_ADDRESSES), [filteredAddresses]);
  const limitReached = filteredAddresses.length > MAX_BATCH_DEMAND_ADDRESSES;

  const { mutateAsync, isPending, isError } = trpc.demands.user.createBatch.useMutation({});

  if (step === 1) {
    return (
      <div className="flex flex-col gap-4">
        {limitReached && (
          <CallOut variant="warning">
            Afin de garantir le bon traitement de vos demandes, nous avons limité le nombre d'adresses à {MAX_BATCH_DEMAND_ADDRESSES}.
          </CallOut>
        )}
        <Step1Form
          addresses={activeAddresses}
          onNext={(data) => {
            setCommonData(data);
            setStep(2);
          }}
        />
      </div>
    );
  }

  return (
    <Step2Form
      addresses={activeAddresses}
      commonData={commonData!}
      onBack={() => setStep(1)}
      onSuccess={onSuccess}
      mutateAsync={mutateAsync}
      isPending={isPending}
      isError={isError}
    />
  );
};

const Step1Form = ({ addresses, onNext }: { addresses: AddressData[]; onNext: (data: BatchDemandStep1Data) => void }) => {
  const { userInfo, setUserInfo } = useUserInfo();

  const { Form, Field, Fieldset, FieldsetLegend, Submit, useValue, form } = useForm({
    defaultValues: {
      company: userInfo.company ?? '',
      companyType: userInfo.companyType ?? '',
      email: userInfo.email ?? '',
      firstName: userInfo.firstName ?? '',
      lastName: userInfo.lastName ?? '',
      phone: userInfo.phone ?? '',
      structure: userInfo.structure ?? '',
      termOfUse: false,
    },
    onSubmit: async ({ value }) => {
      setUserInfo(pick(value, ['company', 'companyType', 'email', 'firstName', 'lastName', 'phone', 'structure']));
      onNext(value as BatchDemandStep1Data);
    },
    schema: zBatchDemandStep1Schema,
  });

  const structure = useValue('structure');

  useEffect(() => {
    if (structure !== 'Tertiaire') {
      form.setFieldValue('companyType', '');
      form.setFieldValue('company', '');
    }
  }, [structure, form]);

  return (
    <Form>
      <div className="flex flex-col gap-4">
        <Stepper
          currentStep={1}
          stepCount={2}
          title={
            <span>
              Informations communes utilisées pour les <strong>{addresses.length}</strong> demandes créées
            </span>
          }
          nextTitle="Informations par adresse"
        />

        <Field.Radio
          label={fieldLabelInformation.structure.label}
          name="structure"
          orientation="horizontal"
          options={fieldLabelInformation.structure.inputs.map(({ value, label }) => ({
            label,
            nativeInputProps: { value },
          }))}
        />

        {structure === 'Maison individuelle' && (
          <CallOut variant="warning">
            Au vu de votre mode de chauffage actuel, le raccordement de votre bâtiment nécessiterait des travaux conséquents et coûteux,
            avec notamment la création d'un réseau interne de distribution.
          </CallOut>
        )}

        {structure === 'Tertiaire' && (
          <Fieldset>
            <FieldsetLegend>{fieldLabelInformation.companyTitle}</FieldsetLegend>
            <div className="grid grid-cols-2 gap-4">
              <Field.Select
                name="companyType"
                label={fieldLabelInformation.companyType.label}
                options={fieldLabelInformation.companyType.inputs}
                nativeSelectProps={{ required: true }}
              />
              <Field.Input name="company" hideOptionalLabel label={fieldLabelInformation.company} />
            </div>
          </Fieldset>
        )}

        <Fieldset>
          <FieldsetLegend>{fieldLabelInformation.contactDetailsTitle}</FieldsetLegend>
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field.Input name="lastName" label={fieldLabelInformation.lastName} />
              <Field.Input name="firstName" label={fieldLabelInformation.firstName} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field.EmailInput name="email" label={fieldLabelInformation.email} />
              <Field.PhoneInput name="phone" label={fieldLabelInformation.phone} />
            </div>
          </div>
        </Fieldset>

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

        <div className="flex gap-4">
          <Submit className="fr-btn">Suivant</Submit>
        </div>
      </div>
    </Form>
  );
};

const Step2Form = ({
  addresses,
  commonData,
  onBack,
  onSuccess,
  mutateAsync,
  isPending,
  isError,
}: {
  addresses: AddressData[];
  commonData: BatchDemandStep1Data;
  onBack: () => void;
  onSuccess: () => void;
  mutateAsync: any;
  isPending: boolean;
  isError: boolean;
}) => {
  const defaultValues = useMemo(
    () => ({
      addresses: addresses.map((addr) => ({
        addressId: addr.id,
        demandArea: undefined,
        demandCompanyName: '',
        demandCompanyType: '',
        heatingEnergy: '',
        heatingType: '',
        nbLogements: undefined,
      })),
    }),
    [addresses]
  );

  const { Form, Field, Fieldset, Submit, useValue } = useForm({
    defaultValues,
    onSubmit: async ({ value }: { value: { addresses: BatchDemandStep2AddressData[] } }) => {
      await mutateAsync({ addressesData: value.addresses, commonInfo: commonData });
      onSuccess();
    },
    schema: zStep2FormSchema,
  });

  const addressesValues = useValue<BatchDemandStep2AddressData[]>('addresses');

  return (
    <Form>
      <div className="flex flex-col gap-4">
        <Stepper currentStep={2} stepCount={2} title="Informations par adresse" />
        <p className="text-sm text-faded">
          Complétez les informations pour chacune des <strong>{addresses.length}</strong> adresses sélectionnées.
        </p>

        {addresses.map((addr, index) => (
          <Accordion
            key={addr.id}
            label={`${index + 1}/${addresses.length}. ${addr.ban_address}`}
            defaultExpanded={index === 0}
            className="mb-2"
            onExpandedChange={(_expanded, e) => {
              e?.stopPropagation();
            }}
          >
            <AddressSection
              index={index}
              structure={commonData.structure}
              companyType={commonData.companyType}
              demandCompanyType={addressesValues?.[index]?.demandCompanyType}
              Field={Field}
              Fieldset={Fieldset}
            />
          </Accordion>
        ))}

        {isError && (
          <div className="text-error mt-4">
            Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
          </div>
        )}

        <div className="flex gap-4 mt-4">
          <Button onClick={onBack}>Précédent</Button>
          <Submit className="fr-btn" disabled={isPending}>
            {isPending ? 'Création en cours...' : `Créer les ${addresses.length} demandes`}
          </Submit>
        </div>
      </div>
    </Form>
  );
};

const AddressSection = ({
  index,
  structure,
  companyType,
  demandCompanyType,
  Field,
  Fieldset,
}: {
  index: number;
  structure: string;
  companyType?: string;
  demandCompanyType?: string;
  Field: any;
  Fieldset: any;
}) => {
  const fieldPrefix = `addresses[${index}]`;

  const showDemandArea =
    structure === 'Tertiaire' && (companyType === 'Gestionnaire de parc tertiaire' || demandCompanyType === 'Bâtiment tertiaire');

  const showNbLogements =
    structure === 'Copropriété' ||
    (structure === 'Tertiaire' &&
      (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') &&
      (demandCompanyType === 'Copropriété' || demandCompanyType === 'Bailleur social')) ||
    (structure === 'Tertiaire' && (companyType === 'Syndic de copropriété' || companyType === 'Bailleur social'));

  const showDemandCompanyFields =
    structure === 'Tertiaire' && (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE');

  return (
    <div className="flex flex-col gap-4">
      <Fieldset>
        <Field.Radio
          label="Type de chauffage"
          name={`${fieldPrefix}.heatingType`}
          orientation="horizontal"
          options={[
            { label: 'Collectif', nativeInputProps: { value: 'collectif' } },
            { label: 'Individuel', nativeInputProps: { value: 'individuel' } },
          ]}
        />
        <Field.Radio
          label={fieldLabelInformation.heatingEnergy.label}
          name={`${fieldPrefix}.heatingEnergy`}
          orientation="horizontal"
          options={fieldLabelInformation.heatingEnergy.inputs.map(({ value, label }) => ({
            label,
            nativeInputProps: { value },
          }))}
        />
        <div className="flex flex-col gap-4">
          {showDemandCompanyFields && (
            <>
              <Field.Select
                name={`${fieldPrefix}.demandCompanyType`}
                label={fieldLabelInformation.demandCompanyType.label}
                options={fieldLabelInformation.demandCompanyType.inputs}
              />

              {demandCompanyType && ['Bâtiment tertiaire', 'Bailleur social', 'Autre'].includes(demandCompanyType) && (
                <Field.Input name={`${fieldPrefix}.demandCompanyName`} label={fieldLabelInformation.demandCompanyName} />
              )}
            </>
          )}
          <div className="flex flex-row gap-4">
            {showDemandArea && <Field.NumberInput name={`${fieldPrefix}.demandArea`} label={fieldLabelInformation.demandArea} />}

            {showNbLogements && <Field.NumberInput name={`${fieldPrefix}.nbLogements`} label={fieldLabelInformation.nbLogements} />}
          </div>
        </div>
      </Fieldset>
    </div>
  );
};
