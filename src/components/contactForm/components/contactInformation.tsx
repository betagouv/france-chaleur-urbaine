import Input from '@components/shared/input';
import { Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesContactInformation = {
  nom: '',
  email: '',
};
export const validationSchemasContactInformation = {
  nom: Yup.string(),
  email: Yup.string()
    .email('Votre adresse email n‘est pas valide')
    .required('Veuillez renseigner votre adresse email'),
};

const ContactInformation = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <div className="fr-my-3w">
        <Field name="nom" label="Nom et Prénom" component={Input} />
      </div>
      <div className="fr-my-3w">
        <Field name="email" label="Email (*)" component={Input} required />
      </div>
    </fieldset>
  );
};

export default ContactInformation;
