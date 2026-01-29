import { fr } from '@codegouvfr/react-dsfr';
import { useRouter } from 'next/router';
import React, { type ReactNode } from 'react';

import useForm from '@/components/form/react-form/useForm';
import Alert from '@/components/ui/Alert';
import { AnalyticsFormId } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import { type ContactFormInfos, fieldLabelInformation, zContactFormCreateDemandInput } from '@/modules/demands/constants';
import { pick } from '@/utils/objects';

type ContactFormProps = {
  onSubmit: (values: ContactFormInfos) => void;
  isLoading?: boolean;
  cardMode?: boolean;
  city?: string;
  heatingTypeInput?: ReactNode; // gets inserted after the building type (structure), used in the network page
};

export const ContactForm = ({ onSubmit, isLoading, cardMode, city, heatingTypeInput }: ContactFormProps) => {
  const router = useRouter();
  const { userInfo, setUserInfo } = useUserInfo();

  const getDefaultStructure = () => {
    switch (router.pathname) {
      case '/coproprietaire':
        return 'Copropriété';
      case '/tertiaire':
        return 'Tertiaire';
      default:
        return '';
    }
  };

  const initialValues = {
    company: userInfo.company ?? '',
    companyType: userInfo.companyType ?? '',
    demandArea: undefined as unknown as number,
    demandCompanyName: userInfo.demandCompanyName ?? '',
    demandCompanyType: userInfo.demandCompanyType ?? '',
    email: userInfo.email ?? '',
    firstName: userInfo.firstName ?? '',
    heatingEnergy: userInfo.heatingEnergy ?? '',
    lastName: userInfo.lastName ?? '',
    nbLogements: undefined as unknown as number,
    phone: userInfo.phone ?? '',
    structure: userInfo.structure ?? getDefaultStructure(),
    termOfUse: false,
  };
  const { form, Form, Field, Fieldset, FieldsetLegend, FieldWrapper, Submit, useValue } = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setUserInfo(
        pick(value, [
          'company',
          'companyType',
          'demandCompanyName',
          'demandCompanyType',
          'email',
          'firstName',
          'heatingEnergy',
          'lastName',
          'phone',
          'structure',
        ])
      );
      onSubmit(value);
    },
    schema: zContactFormCreateDemandInput,
  });

  const structure = useValue('structure');
  const companyType = useValue('companyType');
  const demandCompanyType = useValue('demandCompanyType');

  React.useEffect(() => {
    if (structure !== 'Tertiaire' && companyType) {
      form.setFieldValue('companyType', '');
      form.setFieldValue('company', '');
    }
  }, [structure, companyType, demandCompanyType]);

  return (
    <Form id={AnalyticsFormId.form_contact}>
      <Field.Select
        label={fieldLabelInformation.structure.label}
        name="structure"
        className={fr.cx(`fr-mt-${cardMode ? '1' : '3'}w`)}
        options={fieldLabelInformation.structure.inputs.map(({ value, label }) => ({
          label,
          value,
        }))}
      />
      {structure === 'Maison individuelle' && city !== 'Charleville-Mézières' && (
        <Alert className="mb-2w" variant="warning" size="sm">
          Le raccordement des maisons individuelles reste compliqué à ce jour, pour des raisons techniques et économiques. Il est probable
          que le gestionnaire du réseau ne donne pas suite à votre demande.
        </Alert>
      )}
      {structure === 'Tertiaire' && (
        <Fieldset>
          <FieldsetLegend>{fieldLabelInformation.companyTitle}</FieldsetLegend>
          <FieldWrapper>
            <Field.Select
              name="companyType"
              label={fieldLabelInformation.companyType.label}
              options={fieldLabelInformation.companyType.inputs}
              nativeSelectProps={{
                required: true,
              }}
            />
          </FieldWrapper>
          <FieldWrapper>
            <Field.Input name="company" hideOptionalLabel label={fieldLabelInformation.company} />
          </FieldWrapper>
        </Fieldset>
      )}
      <Fieldset>
        <FieldsetLegend>{fieldLabelInformation.contactDetailsTitle}</FieldsetLegend>
        <FieldWrapper>
          <Field.Input name="lastName" label={fieldLabelInformation.lastName} />
        </FieldWrapper>
        <FieldWrapper>
          <Field.Input name="firstName" label={fieldLabelInformation.firstName} />
        </FieldWrapper>
        <FieldWrapper>
          <Field.EmailInput name="email" label={fieldLabelInformation.email} />
        </FieldWrapper>
        <FieldWrapper>
          <Field.PhoneInput name="phone" label={fieldLabelInformation.phone} />
        </FieldWrapper>
      </Fieldset>
      {(structure === 'Copropriété' || (structure === 'Tertiaire' && companyType !== 'Autre')) && (
        <Fieldset>
          {structure === 'Tertiaire' && (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') && (
            <>
              <FieldWrapper>
                <Field.Select
                  name="demandCompanyType"
                  label={fieldLabelInformation.demandCompanyType.label}
                  options={fieldLabelInformation.demandCompanyType.inputs}
                />
              </FieldWrapper>
              {(demandCompanyType === 'Bâtiment tertiaire' || demandCompanyType === 'Bailleur social' || demandCompanyType === 'Autre') && (
                <FieldWrapper>
                  <Field.Input name="demandCompanyName" hideOptionalLabel label={fieldLabelInformation.demandCompanyName} />
                </FieldWrapper>
              )}
            </>
          )}
          {structure === 'Tertiaire' &&
            (companyType === 'Gestionnaire de parc tertiaire' || demandCompanyType === 'Bâtiment tertiaire') && (
              <FieldWrapper>
                <Field.NumberInput name="demandArea" label={fieldLabelInformation.demandArea} />
              </FieldWrapper>
            )}
          {(structure === 'Copropriété' ||
            (structure === 'Tertiaire' &&
              (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') &&
              (demandCompanyType === 'Copropriété' || demandCompanyType === 'Bailleur social')) ||
            (structure === 'Tertiaire' && (companyType === 'Syndic de copropriété' || companyType === 'Bailleur social'))) && (
            <FieldWrapper>
              <Field.NumberInput name="nbLogements" label={fieldLabelInformation.nbLogements} />
            </FieldWrapper>
          )}
        </Fieldset>
      )}
      <FieldWrapper>{heatingTypeInput}</FieldWrapper>
      <FieldWrapper>
        <Field.Select
          label={heatingTypeInput ? 'Énergie de chauffage :' : fieldLabelInformation.heatingEnergy.label}
          name="heatingEnergy"
          className="heatingEnergyContactInformations"
          options={fieldLabelInformation.heatingEnergy.inputs.map(({ value, label }) => ({
            label,
            value,
          }))}
        />
      </FieldWrapper>
      <FieldWrapper>
        <Field.Checkbox name="termOfUse" label="J’accepte les conditions générales d’utilisation du service." />
      </FieldWrapper>
      <Submit disabled={false} loading={isLoading}>
        Envoyer
      </Submit>
    </Form>
  );
};

export default ContactForm;
