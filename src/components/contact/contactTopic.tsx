import Checkbox from '@components/shared/checkbox';
import Textarea from '@components/shared/textarea';
import { Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesContactTopic = {
  besoin: '',
  contacterUnOperateur: false,
};
export const validationSchemasContactTopic = {
  besoin: Yup.string().required('Veuillez indiquer le motif de votre demande'),
  contacterUnOperateur: Yup.boolean(),
};

const ContactTopic = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <legend className="fr-fieldset__legend fr-text--bold">
        Votre demande
      </legend>

      <div className="fr-my-3w">
        <Field
          name="besoin"
          label="Quel est votre besoin ?"
          component={Textarea}
        />
      </div>

      <div className="fr-my-3w">
        <Field
          name="contacterUnOperateur"
          label="Vous souhaitez que nous contactions pour vous l’exploitant de réseau de votre quartier"
          component={Checkbox}
        />
      </div>
    </fieldset>
  );
};

export default ContactTopic;
