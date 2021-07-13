import Input from '@components/shared/input';
import InputHidden from '@components/shared/InputHidden';
import { Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesContactInformation = {
  prenom: '',
  nom: '',
  email: '',
  telephone: '',
  _acceptCGV: false,
};
export const validationSchemasContactInformation = {
  prenom: Yup.string().required('Veuillez indiquer votre prénom'),
  nom: Yup.string().required('Veuillez indiquer votre nom'),
  email: Yup.string()
    .email('Votre adresse email n‘est pas valide')
    .required('Veuillez renseigner votre adresse email'),
  telephone: Yup.string()
    .length(10)
    .matches(/^[0-9]+$/, 'Veuillez indiquer un numéro de téléphone valide'),
  _acceptCGV: Yup.boolean(),
};

const ContactInformation = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <legend className="fr-fieldset__legend fr-text--bold">Coordonnées</legend>

      <div className="fr-my-3w">
        <Field name="prenom" label="Prénom (*)" component={Input} />
      </div>

      <div className="fr-my-3w">
        <Field name="nom" label="Nom (*)" component={Input} />
      </div>

      <div className="fr-my-3w">
        <Field name="email" label="Email (*)" component={Input} />
      </div>

      <div className="fr-my-3w">
        <Field name="telephone" label="Téléphone" component={Input} />
      </div>
      <div className="fr-my-3w fr-checkbox-group">
        <Field
          name="_acceptCGV"
          tabIndex="-1"
          autoComplete="off"
          component={InputHidden}
        />
      </div>
    </fieldset>
  );
};

export default ContactInformation;
