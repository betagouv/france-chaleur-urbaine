import { fr } from '@codegouvfr/react-dsfr';
import { useRouter } from 'next/router';
import React, { type ReactNode } from 'react';
import { z } from 'zod';

import useForm from '@/components/form/react-form/useForm';
import Alert from '@/components/ui/Alert';
import { AnalyticsFormId } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import type { ContactFormInfos } from '@/types/Summary/Demand';

type ContactFormProps = {
  onSubmit: (values: ContactFormInfos) => void;
  isLoading?: boolean;
  cardMode?: boolean;
  city?: string;
  heatingTypeInput?: ReactNode; // gets inserted after the building type (structure), used in the network page
};

const validationSchema = z
  .object({
    company: z.string().optional(),
    companyType: z.string().optional(),
    demandArea: z.number().optional(),
    demandCompanyName: z.string().optional(),
    demandCompanyType: z.string().optional(),
    email: z.email("Votre adresse email n'est pas valide").min(1, 'Veuillez renseigner votre adresse email'),
    firstName: z.string().min(1, 'Veuillez renseigner votre prénom'),
    heatingEnergy: z
      .string()
      .refine((val) => fieldLabelInformation.heatingEnergy.inputs.some((input) => input.value === val), 'Ce champ est requis'),
    lastName: z.string().min(1, 'Veuillez renseigner votre nom'),
    nbLogements: z.number().optional(),
    phone: z
      .string()
      .regex(/^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$|^$/, 'Veuillez renseigner votre numéro de téléphone sous le format 0605040302')
      .optional(),
    structure: z.string().min(1, 'Veuillez renseigner votre type de bâtiment'),
    termOfUse: z.boolean().refine((val) => val, {
      error: 'Ce champ est requis',
    }),
  })
  .superRefine(({ structure, company, companyType, demandCompanyType, demandCompanyName }, ctx) => {
    const displayIssue = (field: string, message: string) => {
      console.error(field, message);
      ctx.addIssue({
        code: 'custom',
        message,
        path: [field],
      });
    };

    if (structure === 'Tertiaire' && !companyType) {
      displayIssue('companyType', 'Veuillez sélectionner le type de votre structure');
    }
    if (structure === 'Tertiaire' && !company) {
      displayIssue('company', 'Veuillez renseigner le nom de votre structure');
    }
    if (
      structure === 'Tertiaire' &&
      (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') &&
      !demandCompanyType
    ) {
      displayIssue('demandCompanyType', 'Veuillez sélectionner le type de la structure accompagnée');
    }
    if (
      structure === 'Tertiaire' &&
      (companyType === "Bureau d'études ou AMO" || companyType === 'Mandataire / délégataire CEE') &&
      (demandCompanyType === 'Bâtiment tertiaire' || demandCompanyType === 'Bailleur social' || demandCompanyType === 'Autre') &&
      !demandCompanyName
    ) {
      displayIssue('demandCompanyName', 'Veuillez renseigner le nom de la structure accompagnée');
    }
  });

export const fieldLabelInformation = {
  company: 'Nom de votre structure',
  companyTitle: 'Votre structure',
  companyType: {
    inputs: [
      { id: 'syndic', label: 'Syndic de copropriété', value: 'Syndic de copropriété' },
      { id: 'bailleur', label: 'Bailleur social', value: 'Bailleur social' },
      { id: 'gestionnaire', label: 'Gestionnaire de parc tertiaire', value: 'Gestionnaire de parc tertiaire' },
      { id: 'bureau', label: "Bureau d'études ou AMO", value: "Bureau d'études ou AMO" },
      { id: 'mandataire', label: 'Mandataire / délégataire CEE', value: 'Mandataire / délégataire CEE' },
    ],
    label: 'Type de structure',
  },
  contactDetailsTitle: 'Vos coordonnées',
  demandArea: 'Surface en m2',
  demandCompanyName: 'Nom de la structure accompagnée',
  demandCompanyType: {
    inputs: [
      { id: 'copro', label: 'une copropriété', value: 'Copropriété' },
      { id: 'maison', label: 'une maison individuelle', value: 'Maison individuelle' },
      { id: 'batiment', label: 'un bâtiment tertiaire', value: 'Bâtiment tertiaire' },
      { id: 'bailleur', label: 'du logement social', value: 'Bailleur social' },
      { id: 'autre', label: 'autre', value: 'Autre' },
    ],
    label: 'Votre demande concerne',
  },
  email: 'Email',
  firstName: 'Prénom',
  heatingEnergy: {
    inputs: [
      { id: 'electricite', label: 'Électricité', value: 'électricité' },
      { id: 'gaz', label: 'Gaz', value: 'gaz' },
      { id: 'fioul', label: 'Fioul', value: 'fioul' },
      { id: 'autre', label: 'Autre / Je ne sais pas', value: 'autre' },
    ],
    label: 'Mode de chauffage',
  },
  lastName: 'Nom',
  nbLogements: 'Nombre de logements',
  phone: 'Téléphone',
  structure: {
    inputs: [
      { id: 'copropriete', label: 'Copropriétaire', value: 'Copropriété' },
      {
        id: 'maison',
        label: 'Propriétaire de maison individuelle',
        value: 'Maison individuelle',
      },
      { id: 'tertiaire', label: 'Professionnel', value: 'Tertiaire' },
    ],
    label: 'Vous êtes...',
  },
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
    company: userInfo?.company ?? '',
    companyType: userInfo?.companyType ?? '',
    demandArea: undefined as unknown as number,
    demandCompanyName: userInfo?.demandCompanyName ?? '',
    demandCompanyType: userInfo?.demandCompanyType ?? '',
    email: userInfo?.email ?? '',
    firstName: userInfo?.firstName ?? '',
    heatingEnergy: userInfo?.heatingEnergy ?? '',
    lastName: userInfo?.lastName ?? '',
    nbLogements: undefined as unknown as number,
    phone: userInfo?.phone ?? '',
    structure: userInfo?.structure ?? getDefaultStructure(),
    termOfUse: false,
  };
  const { form, Form, Field, Fieldset, FieldsetLegend, FieldWrapper, Submit, useValue } = useForm({
    defaultValues: initialValues,
    onSubmit: async ({ value }) => {
      setUserInfo({
        company: value.company,
        companyType: value.companyType,
        demandCompanyName: value.demandCompanyName,
        demandCompanyType: value.demandCompanyType,
        email: value.email,
        firstName: value.firstName,
        heatingEnergy: value.heatingEnergy,
        lastName: value.lastName,
        phone: value.phone,
        structure: value.structure,
      });
      onSubmit(value);
    },
    schema: validationSchema,
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
      <Field.Radio
        label={fieldLabelInformation.structure.label}
        name="structure"
        className={fr.cx(`fr-mt-${cardMode ? '1' : '3'}w`)}
        orientation={cardMode ? 'vertical' : 'horizontal'}
        options={fieldLabelInformation.structure.inputs.map(({ value, label }) => ({
          label,
          nativeInputProps: {
            value,
          },
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
        <Field.Radio
          label={heatingTypeInput ? 'Énergie de chauffage :' : fieldLabelInformation.heatingEnergy.label}
          name="heatingEnergy"
          className="heatingEnergyContactInformations"
          orientation={cardMode ? 'vertical' : 'horizontal'}
          options={fieldLabelInformation.heatingEnergy.inputs.map(({ value, label }) => ({
            label,
            nativeInputProps: {
              value,
            },
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
