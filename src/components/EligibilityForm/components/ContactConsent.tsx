import Checkbox from '@components/shared/checkbox';
import { Field } from 'formik';
import * as Yup from 'yup';

export const fieldLabelConsent = {
  termOfUse: 'J’accepte les conditions générales d’utilisation du service. (*)',
};

export const defaultValuesContactConsent = {
  termOfUse: false,
};

export const validationSchemasContactConsent = {
  termOfUse: Yup.boolean().oneOf([true], 'Ce champ est requis'),
};

const ContactConsent = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <div className="fr-my-3w fr-checkbox-group">
        <Field
          name="termOfUse"
          label={fieldLabelConsent.termOfUse}
          component={Checkbox}
        />
      </div>
    </fieldset>
  );
};

export default ContactConsent;
