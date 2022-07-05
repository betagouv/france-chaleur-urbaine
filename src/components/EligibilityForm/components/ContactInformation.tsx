import Input from '@components/shared/input';
import RadioGroup from '@components/shared/RadioGroup';
import { Field, useFormikContext } from 'formik';
import styled from 'styled-components';
import * as Yup from 'yup';

const InputWraper = styled.div`
  opacity: 1;
  max-height: 8em;
  overflow: hidden;
  transition: opacity 0.25s ease, max-height 0.75s ease;

  &.hidden {
    opacity: 0;
    max-height: 0;
  }
`;

export const fieldLabelInformation = {
  structure: {
    label: 'Type de bâtiment (*)',
    inputs: [
      { value: 'Copropriété', label: 'Copropriété', id: 'copropriete' },
      { value: 'Tertiaire', label: 'Tertiaire', id: 'tertiaire' },
    ],
  },
  lastName: 'Nom',
  firstName: 'Prénom',
  company: 'Établissement',
  email: 'Email (*)',
  heatingEnergy: {
    label: 'Mode de chauffage actuel (*)',
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
};
export const validationSchemasContactInformation = {
  structure: Yup.string().required(
    'Veuillez renseigner votre type de bâtiment'
  ),
  lastName: Yup.string(),
  firstName: Yup.string(),
  company: Yup.string(),
  email: Yup.string()
    .email('Votre adresse email n‘est pas valide')
    .required('Veuillez renseigner votre adresse email'),
  heatingEnergy: Yup.string()
    .required('Veuillez renseigner votre chauffage')
    .oneOf(
      fieldLabelInformation.heatingEnergy.inputs.map(({ value }) => value),
      'Ce champ est requis'
    ),
};

const ContactInformation = () => {
  const { values }: any = useFormikContext();
  return (
    <>
      <fieldset className="fr-fieldset fr-my-3w">
        <InputWraper>
          <RadioGroup
            label={fieldLabelInformation.structure.label}
            name="structure"
            inputs={fieldLabelInformation.structure.inputs}
          />
        </InputWraper>
      </fieldset>
      <fieldset className="fr-fieldset fr-my-3w">
        <InputWraper className="fr-my-3w">
          <Field
            name="lastName"
            label={fieldLabelInformation.lastName}
            component={Input}
          />
        </InputWraper>
        <InputWraper className="fr-my-3w">
          <Field
            name="firstName"
            label={fieldLabelInformation.firstName}
            component={Input}
          />
        </InputWraper>
        <InputWraper
          className={`fr-my-3w ${
            !values.structure || values.structure !== 'Tertiaire'
              ? 'hidden'
              : ''
          }`}
        >
          <Field
            name="company"
            label={fieldLabelInformation.company}
            component={Input}
            {...(!values.structure || values.structure !== 'Tertiaire'
              ? { value: '' }
              : {})}
          />
        </InputWraper>
        <InputWraper className="fr-my-3w">
          <Field
            name="email"
            label={fieldLabelInformation.email}
            component={Input}
            required
          />
        </InputWraper>
      </fieldset>
      <fieldset className="fr-fieldset fr-my-3w">
        <InputWraper>
          <RadioGroup
            label={fieldLabelInformation.heatingEnergy.label}
            name="heatingEnergy"
            inputs={fieldLabelInformation.heatingEnergy.inputs}
          />
        </InputWraper>
      </fieldset>
    </>
  );
};

export default ContactInformation;
