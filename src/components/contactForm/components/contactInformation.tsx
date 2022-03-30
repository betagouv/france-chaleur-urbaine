import Input from '@components/shared/input';
import RadioGroup from '@components/shared/RadioGroup';
import { Field } from 'formik';
import * as Yup from 'yup';

export const fieldLabelInformation = {
  email: 'Email (*)',
  nom: 'Nom et Prénom',
  chauffage: {
    label: 'Mode de chauffage Actuel (*)',
    inputs: [
      { value: 'électricité', label: 'Électricité', id: 'electricite' },
      {
        value: 'gaz individuel',
        label: 'Gaz Individuel',
        id: 'gaz-individuel',
      },
      { value: 'gaz collectif', label: 'Gaz Collectif', id: 'gaz-collectif' },
      {
        value: 'fioul collectif',
        label: 'Fioul Collectif',
        id: 'fioul-collectif',
      },
      { value: 'autre', label: 'Autre / Je ne sais pas', id: 'autre' },
    ],
  },
};

export const defaultValuesContactInformation = {
  nom: '',
  email: '',
  chauffage: '',
};
export const validationSchemasContactInformation = {
  nom: Yup.string(),
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
  return (
    <>
      <fieldset className="fr-fieldset fr-my-3w">
        <div className="fr-my-3w">
          <Field
            name="nom"
            label={fieldLabelInformation.nom}
            component={Input}
          />
        </div>
        <div className="fr-my-3w">
          <Field
            name="email"
            label={fieldLabelInformation.email}
            component={Input}
            required
          />
        </div>
      </fieldset>
      <fieldset className="fr-fieldset fr-my-3w">
        <div>
          <RadioGroup
            label={fieldLabelInformation.chauffage.label}
            name="chauffage"
            inputs={fieldLabelInformation.chauffage.inputs}
          />
        </div>
      </fieldset>
    </>
  );
};

export default ContactInformation;
