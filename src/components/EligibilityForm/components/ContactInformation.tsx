import Input from '@components/shared/input';
import RadioGroup from '@components/shared/RadioGroup';
import { Field, useFormikContext } from 'formik';
import styled from 'styled-components';
import * as Yup from 'yup';

const InputWraper = styled.div<{ hidden?: boolean }>`
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
    label: '',
    inputs: [
      { value: 'Copropriété', label: 'Copropriété', id: 'copropriete' },
      { value: 'Tertiaire', label: 'Tertiaire', id: 'tertiaire' },
    ],
  },
  nom: 'Nom',
  prenom: 'Prénom',
  etablissement: 'Établissement',
  email: 'Email (*)',
  chauffage: {
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
  nom: '',
  prenom: '',
  etablissement: '',
  email: '',
  chauffage: '',
};
export const validationSchemasContactInformation = {
  structure: Yup.string(),
  nom: Yup.string(),
  prenom: Yup.string(),
  etablissement: Yup.string(),
  email: Yup.string()
    .email('Votre adresse email n‘est pas valide')
    .required('Veuillez renseigner votre adresse email'),
  chauffage: Yup.string()
    .required('Veuillez renseigner votre chauffage')
    .oneOf(
      fieldLabelInformation.chauffage.inputs.map(({ value }) => value),
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
            name="nom"
            label={fieldLabelInformation.nom}
            component={Input}
          />
        </InputWraper>
        <InputWraper className="fr-my-3w">
          <Field
            name="prenom"
            label={fieldLabelInformation.prenom}
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
            name="etablissement"
            label={fieldLabelInformation.etablissement}
            component={Input}
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
            label={fieldLabelInformation.chauffage.label}
            name="chauffage"
            inputs={fieldLabelInformation.chauffage.inputs}
          />
        </InputWraper>
      </fieldset>
    </>
  );
};

export default ContactInformation;
