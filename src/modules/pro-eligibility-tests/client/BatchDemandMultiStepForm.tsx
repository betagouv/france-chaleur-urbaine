import Stepper from '@codegouvfr/react-dsfr/Stepper';
import { useEffect, useState } from 'react';
import useForm from '@/components/form/react-form/useForm';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import CallOut from '@/components/ui/CallOut';
import Link from '@/components/ui/Link';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import {
  type BatchDemandStep1Data,
  fieldLabelInformation,
  zBatchDemandStep1Schema,
  zBatchDemandStep2Schema,
} from '@/modules/demands/constants';
import trpc from '@/modules/trpc/client';
import { pick } from '@/utils/objects';

type AddressData = {
  id: string;
  ban_address: string | null;
};

interface BatchDemandMultiStepFormProps {
  addresses: AddressData[];
  onSuccess: () => void;
}

export const BatchDemandMultiStepForm = ({ addresses, onSuccess }: BatchDemandMultiStepFormProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [commonData, setCommonData] = useState<BatchDemandStep1Data>();

  const { mutateAsync, isPending, isError } = trpc.demands.user.createBatch.useMutation({});

  if (step === 1) {
    return (
      <Step1Form
        addresses={addresses}
        onNext={(data) => {
          setCommonData(data);
          setStep(2);
        }}
      />
    );
  }

  return (
    <Step2Form
      addresses={addresses}
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
  const { Form, Field, Fieldset, Submit, useValue } = useForm({
    onSubmit: async ({ value }: { value: Record<string, any> }) => {
      const addressesData = addresses.map((addr) => ({
        addressId: addr.id,
        demandArea: value[`${addr.id}_demandArea`] as number | undefined,
        demandCompanyName: value[`${addr.id}_demandCompanyName`] as string | undefined,
        demandCompanyType: value[`${addr.id}_demandCompanyType`] as string | undefined,
        heatingEnergy: value[`${addr.id}_heatingEnergy`] as string,
        heatingType: value[`${addr.id}_heatingType`] as string,
        nbLogements: value[`${addr.id}_nbLogements`] as number | undefined,
      }));

      await mutateAsync({ addressesData, commonInfo: commonData });

      onSuccess();
    },
    schema: zBatchDemandStep2Schema,
  });

  return (
    <Form>
      <div className="flex flex-col gap-4">
        <Stepper currentStep={2} stepCount={2} title="Informations par adresse" />
        <p className="text-sm text-faded">
          Complétez les informations pour chacune des <strong>{addresses.length}</strong> adresses sélectionnées.
        </p>

        {addresses.map((addr, index) => (
          <AddressSection
            key={addr.id}
            address={addr}
            index={index}
            structure={commonData.structure}
            companyType={commonData.companyType}
            Field={Field}
            Fieldset={Fieldset}
            useValue={useValue}
          />
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
  address,
  index,
  structure,
  companyType,
  Field,
  Fieldset,
  useValue,
}: {
  address: AddressData;
  index: number;
  structure: string;
  companyType?: string;
  Field: any;
  Fieldset: any;
  useValue: any;
}) => {
  const demandCompanyType = useValue(`${address.id}_demandCompanyType`);
  const displayAddress = address.ban_address;

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
    <Accordion
      key={address.id}
      label={`${index + 1}. ${displayAddress}`}
      defaultExpanded={index === 0}
      className="mb-2"
      onExpandedChange={(_expanded, e) => {
        e?.stopPropagation();
      }}
    >
      <div className="flex flex-col gap-4">
        <Fieldset>
          <Field.Radio
            label="Type de chauffage"
            name={`${address.id}_heatingType`}
            orientation="horizontal"
            options={[
              { label: 'Collectif', nativeInputProps: { value: 'collectif' } },
              { label: 'Individuel', nativeInputProps: { value: 'individuel' } },
            ]}
          />
          <Field.Radio
            label={fieldLabelInformation.heatingEnergy.label}
            name={`${address.id}_heatingEnergy`}
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
                  name={`${address.id}_demandCompanyType`}
                  label={fieldLabelInformation.demandCompanyType.label}
                  options={fieldLabelInformation.demandCompanyType.inputs}
                />

                {demandCompanyType && ['Bâtiment tertiaire', 'Bailleur social', 'Autre'].includes(demandCompanyType) && (
                  <Field.Input name={`${address.id}_demandCompanyName`} label={fieldLabelInformation.demandCompanyName} />
                )}
              </>
            )}
            <div className="flex flex-row gap-4">
              {showDemandArea && <Field.NumberInput name={`${address.id}_demandArea`} label={fieldLabelInformation.demandArea} />}

              {showNbLogements && <Field.NumberInput name={`${address.id}_nbLogements`} label={fieldLabelInformation.nbLogements} />}
            </div>
          </div>
        </Fieldset>
      </div>
    </Accordion>
  );
};
