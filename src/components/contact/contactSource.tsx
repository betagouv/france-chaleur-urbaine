import Checkbox from '@components/checkbox';
import Select from '@components/select';
import { ErrorMessage, Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesContactOriginAndDataSection = {
  contactOrigin: '',
  collectDataAgreement: undefined,
};
export const validationSchemasContactSource = {
  contactOrigin: Yup.string().required('Required'),
  collectDataAgreement: Yup.boolean().required('Required'),
};

const ContactSource = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <legend className="fr-fieldset__legend fr-text--bold">
        Découverte et données
      </legend>

      <div className="fr-my-3w">
        <Field
          name="contactOrigin"
          id="contactOrigin"
          label="Comment avez-vous entendu parlé de France chaleur urbaine"
          component={Select}
        />
        <ErrorMessage
          name="contactOrigin"
          component={'p'}
          className="fr-error-text"
        />
      </div>

      <div className="fr-my-3w fr-checkbox-group">
        <Field
          type="checkbox"
          name="collectDataAgreement"
          id="collectDataAgreement"
          label="Les données collectées sont uniquement utilisées à des fins d’annalyse par le minitère de la transition écologique"
          component={Checkbox}
        />
        <ErrorMessage
          name="collectDataAgreement"
          component={'p'}
          className="fr-error-text"
        />
      </div>
    </fieldset>
  );
};

export default ContactSource;
