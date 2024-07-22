import { fr } from '@codegouvfr/react-dsfr';
import { Alert } from '@codegouvfr/react-dsfr/Alert';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import { Field, useFormikContext } from 'formik';
import { ReactNode } from 'react';
import styled from 'styled-components';
import * as Yup from 'yup';

import Input from '@components/form/formik/input';
import Box from '@components/ui/Box';

const InputWraper = styled(Box)`
  opacity: 1;
  transition:
    opacity 0.25s ease,
    max-height 0.5s ease;

  &.hidden {
    opacity: 0;
    max-height: 0;
  }

  // override fr-fieldset__element
  && {
    margin-bottom: 0;
  }
`;

export const fieldLabelInformation = {
  structure: {
    label: 'Type de bâtiment :',
    inputs: [
      { value: 'Copropriété', label: 'Copropriété', id: 'copropriete' },
      { value: 'Tertiaire', label: 'Tertiaire', id: 'tertiaire' },
      {
        value: 'Maison individuelle',
        label: 'Maison individuelle',
        id: 'maison',
      },
      { value: 'Bailleur social', label: 'Bailleur social', id: 'bailleur' },
    ],
  },
  lastName: 'Nom :',
  firstName: 'Prénom :',
  company: 'Établissement',
  email: 'Email :',
  phone: 'Téléphone :',
  heatingEnergy: {
    label: 'Mode de chauffage actuel :',
    inputs: [
      { value: 'électricité', label: 'Électricité', id: 'electricite' },
      { value: 'gaz', label: 'Gaz', id: 'gaz' },
      { value: 'fioul', label: 'Fioul', id: 'fioul' },
      { value: 'autre', label: 'Autre / Je ne sais pas', id: 'autre' },
    ],
  },
};
export const defaultValuesContactInformation = {
  structure: '',
  lastName: '',
  firstName: '',
  company: '',
  email: '',
  heatingEnergy: '',
  phone: '',
};
export const validationSchemasContactInformation = {
  structure: Yup.string().required('Veuillez renseigner votre type de bâtiment'),
  lastName: Yup.string().required('Veuillez renseigner votre nom'),
  firstName: Yup.string().required('Veuillez renseigner votre prénom'),
  company: Yup.string(),
  phone: Yup.string().matches(
    /^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$/,
    'Veuillez renseigner votre numéro de téléphone sous le format 0605040302'
  ),
  email: Yup.string().email('Votre adresse email n‘est pas valide').required('Veuillez renseigner votre adresse email'),
  heatingEnergy: Yup.string()
    .required('Veuillez renseigner votre chauffage')
    .oneOf(
      fieldLabelInformation.heatingEnergy.inputs.map(({ value }) => value),
      'Ce champ est requis'
    ),
};

const ContactInformation = ({
  cardMode,
  city,
  heatingTypeInput,
}: {
  cardMode?: boolean;
  city?: string;
  heatingTypeInput?: ReactNode; // gets inserted after the building type (structure), used in the network page
}) => {
  const { values }: any = useFormikContext();
  return (
    <>
      <Field required>
        {({ field }: any) => (
          <RadioButtons
            legend={fieldLabelInformation.structure.label}
            name="structure"
            className={fr.cx(`fr-mt-${cardMode ? '1' : '3'}w`)}
            orientation={cardMode ? 'vertical' : 'horizontal'}
            options={fieldLabelInformation.structure.inputs.map(({ value, label }) => ({
              label: label,
              nativeInputProps: {
                value: value,
                onChange: field.onChange,
              },
            }))}
          />
        )}
      </Field>
      {values.structure === 'Maison individuelle' && city !== 'Charleville-Mézières' && (
        <Alert
          className={fr.cx('fr-mt-2w')}
          severity="warning"
          small
          description="Le raccordement des maisons individuelles reste compliqué à ce jour, pour des raisons techniques et économiques. Il est probable que le gestionnaire du réseau ne donne pas suite à votre demande."
        />
      )}
      {heatingTypeInput}
      <Field required>
        {({ field }: any) => (
          <RadioButtons
            legend={heatingTypeInput ? 'Énergie de chauffage :' : fieldLabelInformation.heatingEnergy.label}
            name="heatingEnergy"
            className={fr.cx('fr-my-1w')}
            orientation={cardMode ? 'vertical' : 'horizontal'}
            options={fieldLabelInformation.heatingEnergy.inputs.map(({ value, label }) => ({
              label: label,
              nativeInputProps: {
                value: value,
                onChange: field.onChange,
              },
            }))}
          />
        )}
      </Field>
      <fieldset className={fr.cx('fr-fieldset')}>
        <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
          <Field name="lastName" required label={fieldLabelInformation.lastName} component={Input} />
        </InputWraper>
        <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
          <Field name="firstName" required label={fieldLabelInformation.firstName} component={Input} />
        </InputWraper>
        {values.structure === 'Tertiaire' && (
          <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
            <Field name="company" label={fieldLabelInformation.company} component={Input} required />
          </InputWraper>
        )}
        <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
          <Field name="email" type="email" label={fieldLabelInformation.email} component={Input} required />
        </InputWraper>
        <InputWraper className={fr.cx('fr-fieldset__element')} my="1w">
          <Field name="phone" placeholder="0605040302" label={fieldLabelInformation.phone} component={Input} />
        </InputWraper>
      </fieldset>
    </>
  );
};

export default ContactInformation;
