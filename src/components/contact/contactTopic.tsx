import Checkbox from '@components/checkbox';
import Textarea from '@components/textarea';
import { ErrorMessage, Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesContactTopic = {
  needTopic: '',
  contactOperator: false,
};
export const validationSchemasContactTopic = {
  needTopic: Yup.string().required('Required'),
  contactOperator: Yup.boolean().required('Required'),
};

const ContactTopic = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <legend className="fr-fieldset__legend fr-text--bold">
        Votre demande
      </legend>

      <div className="fr-my-3w">
        <Field
          name="needTopic"
          id="needTopic"
          label="Quel est votre besoin ?"
          component={Textarea}
        />
        <ErrorMessage
          name="needTopic"
          component={'p'}
          className="fr-error-text"
        />
      </div>

      <div className="fr-my-3w fr-checkbox-group">
        <Field
          type="checkbox"
          name="contactOperator"
          id="contactOperator"
          label="Vous souhaitez que nous contactions pour vous l’exploitant de réseau de votre quartier"
          component={Checkbox}
        />
        <ErrorMessage
          name="contactOperator"
          component={'p'}
          className="fr-error-text"
        />
      </div>
    </fieldset>
  );
};

export default ContactTopic;
