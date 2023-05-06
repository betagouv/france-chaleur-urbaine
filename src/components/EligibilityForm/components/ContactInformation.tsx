import Input from '@components/shared/input';
import RadioGroup from '@components/shared/RadioGroup';
import { Field, useFormikContext } from 'formik';
import styled from 'styled-components';
import * as Yup from 'yup';

const InputWraper = styled.div`
  opacity: 1;
  transition: opacity 0.25s ease, max-height 0.5s ease;

  &.hidden {
    opacity: 0;
    max-height: 0;
  }

  .fr-form-group {
    margin-bottom: 0;
  }
`;

export const fieldLabelInformation = {
  structure: {
    label: 'Type de bâtiment :',
    inputs: [
      { value: 'Copropriété', label: 'Copropriété', id: 'copropriete' },
      { value: 'Tertiaire', label: 'Tertiaire', id: 'tertiaire' },
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
  structure: Yup.string().required(
    'Veuillez renseigner votre type de bâtiment'
  ),
  lastName: Yup.string().required('Veuillez renseigner votre nom'),
  firstName: Yup.string().required('Veuillez renseigner votre prénom'),
  company: Yup.string(),
  phone: Yup.string().matches(
    /^(?:(?:\+|00)33|0)\s*[1-9]\d{8}$/,
    'Veuillez renseigner votre numéro de téléphone sous le format 0605040302'
  ),
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

const ContactInformation = ({ cardMode }: { cardMode?: boolean }) => {
  const { values }: any = useFormikContext();
  return (
    <>
      <fieldset className={`fr-fieldset fr-mt-${cardMode ? '1' : '3'}w`}>
        <InputWraper>
          <RadioGroup
            required
            isInline={!cardMode}
            label={fieldLabelInformation.structure.label}
            name="structure"
            inputs={fieldLabelInformation.structure.inputs}
          />
        </InputWraper>
      </fieldset>
      <fieldset className="fr-fieldset">
        <InputWraper className="fr-my-1w">
          <Field
            name="lastName"
            required
            label={fieldLabelInformation.lastName}
            component={Input}
          />
        </InputWraper>
        <InputWraper className="fr-my-1w">
          <Field
            name="firstName"
            required
            label={fieldLabelInformation.firstName}
            component={Input}
          />
        </InputWraper>
        {values.structure === 'Tertiaire' && (
          <InputWraper className="fr-my-1w">
            <Field
              name="company"
              label={fieldLabelInformation.company}
              component={Input}
              required
            />
          </InputWraper>
        )}
        <InputWraper className="fr-my-1w">
          <Field
            name="email"
            type="email"
            label={fieldLabelInformation.email}
            component={Input}
            required
          />
        </InputWraper>
        <InputWraper className="fr-my-1w without-arrows">
          <Field
            name="phone"
            placeholder="0605040302"
            label={fieldLabelInformation.phone}
            component={Input}
          />
        </InputWraper>
      </fieldset>
      <fieldset className="fr-fieldset fr-my-1w">
        <InputWraper>
          <RadioGroup
            label={fieldLabelInformation.heatingEnergy.label}
            name="heatingEnergy"
            inputs={fieldLabelInformation.heatingEnergy.inputs}
            required
            isInline={!cardMode}
          />
        </InputWraper>
      </fieldset>
    </>
  );
};

export default ContactInformation;
