import Checkbox from '@components/shared/checkbox';
import Select from '@components/shared/select';
import { Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesSourceAndDataSection = {
  source: '',
  collecterMesDonnees: false,
};
export const validationSchemasContactSource = {
  source: Yup.string(),
  collecterMesDonnees: Yup.boolean().oneOf([true], 'Ce champ est requis'),
};

const ContactSource = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <legend className="fr-fieldset__legend fr-text--bold">
        Découverte et données
      </legend>

      <div className="fr-my-3w">
        <Field
          name="source"
          label="Comment avez-vous entendu parler de France Chaleur Urbaine"
          component={Select}
        >
          <option defaultValue="" hidden>
            Selectionnez une option
          </option>
          <option value="mail">Mail</option>
          <option value="bouche à oreille">Bouche à oreille</option>
          <option value="linkedin">Linkedin</option>
          <option value="google">Google</option>
          <option value="autre">Autre</option>
        </Field>
      </div>

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

export default ContactSource;
