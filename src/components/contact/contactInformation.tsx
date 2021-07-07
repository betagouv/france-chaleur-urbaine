import Input from '@components/input';
import { ErrorMessage, Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesContactInformation = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
};
export const validationSchemasContactInformation = {
  firstName: Yup.string()
    .matches(/^[a-z]+$/, 'No Numbers allow')
    .required('Required'),
  lastName: Yup.string()
    .matches(/^[a-z]+$/, 'numbers are not allow')
    .required('Required'),
  email: Yup.string().email('Invalid email address').required('Required'),
  phoneNumber: Yup.string()
    .length(10)
    .matches(/^[0-9]+$/, 'Letters are not allow')
    .required('Required'),
};

const ContactInformation = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <legend className="fr-fieldset__legend fr-text--bold">Coordonnées</legend>

      <div className="fr-my-3w">
        <Field
          name="firstName"
          id="firstName"
          label="Prénom"
          component={Input}
        />
        <ErrorMessage
          name="firstName"
          component={'p'}
          className="fr-error-text"
        />
      </div>

      <div className="fr-my-3w">
        <Field name="lastName" id="lastName" label="Nom" component={Input} />
        <ErrorMessage
          name="lastName"
          component={'p'}
          className="fr-error-text"
        />
      </div>

      <div className="fr-my-3w">
        <Field name="email" id="email" label="Email" component={Input} />
        <ErrorMessage name="email" component={'p'} className="fr-error-text" />
      </div>

      <div className="fr-my-3w">
        <Field
          name="phoneNumber"
          id="phoneNumber"
          label="Téléphone"
          component={Input}
        />
        <ErrorMessage
          name="phoneNumber"
          component={'p'}
          className="fr-error-text"
        />
      </div>
    </fieldset>
  );
};

export default ContactInformation;
