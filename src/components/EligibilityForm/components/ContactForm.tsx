import { fr } from '@codegouvfr/react-dsfr';
import { useRouter } from 'next/router';
import React, { type ReactNode } from 'react';
import { z } from 'zod';

import useForm from '@/components/form/react-form/useForm';
import Alert from '@/components/ui/Alert';
import { AnalyticsFormId } from '@/services/analytics';
import { type ContactFormInfos } from '@/types/Summary/Demand';

type ContactFormProps = {
  onSubmit: (values: ContactFormInfos) => void;
  isLoading?: boolean;
  cardMode?: boolean;
  city?: string;
  heatingTypeInput?: ReactNode; // gets inserted after the building type (structure), used in the network page
};

const validationSchema = z
  .object({
    structure: z.string().min(1, 'Veuillez renseigner votre type de bâtiment'),
    lastName: z.string().min(1, 'Veuillez renseigner votre nom'),
    firstName: z.string().min(1, 'Veuillez renseigner votre prénom'),
    company: z.string().optional(),
    companyType: z.string().optional(),
    phone: z
      .string()
      .regex(/^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$|^$/, 'Veuillez renseigner votre numéro de téléphone sous le format 0605040302')
      .optional(),
    email: z.string().email("Votre adresse email n'est pas valide").min(1, 'Veuillez renseigner votre adresse email'),
    heatingEnergy: z
      .string()
      .refine((val) => fieldLabelInformation.heatingEnergy.inputs.some((input) => input.value === val), 'Ce champ est requis'),
    nbLogements: z.number().optional(),
    demandCompanyType: z.string().optional(),
    demandCompanyName: z.string().optional(),
    demandArea: z.number().optional(),
    termOfUse: z.boolean().refine((val) => val, {
      message: 'Ce champ est requis',
    }),
  })
  .superRefine(({ structure, company, companyType, demandCompanyType, demandCompanyName }, ctx) => {
    const displayIssue = (field: string, message: string) => {
      console.error(field, message);
      ctx.addIssue({
        path: [field],
        code: z.ZodIssueCode.custom,
        message,
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
  structure: {
    label: 'Vous êtes...',
    inputs: [
      { value: 'Copropriété', label: 'Copropriétaire', id: 'copropriete' },
      {
        value: 'Maison individuelle',
        label: 'Propriétaire de maison individuelle',
        id: 'maison',
      },
      { value: 'Tertiaire', label: 'Professionnel', id: 'tertiaire' },
    ],
  },
  companyTitle: 'Votre structure',
  company: 'Nom de votre structure',
  companyType: {
    label: 'Type de structure',
    inputs: [
      { value: 'Syndic de copropriété', label: 'Syndic de copropriété', id: 'syndic' },
      { value: 'Bailleur social', label: 'Bailleur social', id: 'bailleur' },
      { value: 'Gestionnaire de parc tertiaire', label: 'Gestionnaire de parc tertiaire', id: 'gestionnaire' },
      { value: "Bureau d'études ou AMO", label: "Bureau d'études ou AMO", id: 'bureau' },
      { value: 'Mandataire / délégataire CEE', label: 'Mandataire / délégataire CEE', id: 'mandataire' },
    ],
  },
  contactDetailsTitle: 'Vos coordonnées',
  lastName: 'Nom',
  firstName: 'Prénom',
  email: 'Email',
  phone: 'Téléphone',
  nbLogements: 'Nombre de logements',
  demandCompanyType: {
    label: 'Votre demande concerne',
    inputs: [
      { value: 'Copropriété', label: 'une copropriété', id: 'copro' },
      { value: 'Maison individuelle', label: 'une maison individuelle', id: 'maison' },
      { value: 'Bâtiment tertiaire', label: 'un bâtiment tertiaire', id: 'batiment' },
      { value: 'Bailleur social', label: 'du logement social', id: 'bailleur' },
      { value: 'Autre', label: 'autre', id: 'autre' },
    ],
  },
  demandCompanyName: 'Nom de la structure accompagnée',
  demandArea: 'Surface en m2',
  heatingEnergy: {
    label: 'Mode de chauffage',
    inputs: [
      { value: 'électricité', label: 'Électricité', id: 'electricite' },
      { value: 'gaz', label: 'Gaz', id: 'gaz' },
      { value: 'fioul', label: 'Fioul', id: 'fioul' },
      { value: 'autre', label: 'Autre / Je ne sais pas', id: 'autre' },
    ],
  },
};

export const ContactForm = ({ onSubmit, isLoading, cardMode, city, heatingTypeInput }: ContactFormProps) => {
  const router = useRouter();

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
    lastName: '',
    firstName: '',
    company: '',
    companyType: '',
    email: '',
    phone: '',
    nbLogements: undefined as unknown as number,
    demandCompanyType: '',
    demandCompanyName: '',
    demandArea: undefined as unknown as number,
    heatingEnergy: '',
    termOfUse: false,
    structure: getDefaultStructure(),
  };
  const { form, Form, Field, Fieldset, FieldsetLegend, FieldWrapper, Submit, useValue } = useForm({
    defaultValues: initialValues,
    schema: validationSchema,
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
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
          label: label,
          nativeInputProps: {
            value: value,
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
            ></Field.Select>
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
        </Fieldset>
      )}
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
