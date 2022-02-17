import Checkbox from '@components/shared/checkbox';
import { Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesContactConsent = {
  collecterMesDonnees: false,
};
export const validationSchemasContactConsent = {
  collecterMesDonnees: Yup.boolean().oneOf([true], 'Ce champ est requis'),
};

const contactConsent = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <div className="fr-my-3w fr-checkbox-group">
        <Field
          name="collecterMesDonnees"
          label="J’accepte que les données collectées soient uniquement utilisées à des fins d’analyse par le ministère de la transition écologique. (*)"
          component={Checkbox}
        />
      </div>
    </fieldset>
  );
};

export default contactConsent;
