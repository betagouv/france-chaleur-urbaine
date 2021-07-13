import Input from '@components/shared/input';
import Select from '@components/shared/select';
import { Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesContactCoOwnership = {
  nombreDeLogement: '',
  modeDeChauffage: '',
  status: '',
};
export const validationSchemasContactCoOwnership = {
  nombreDeLogement: Yup.number(),
  modeDeChauffage: Yup.string(),
  status: Yup.string(),
};

const ContactCoOwnership = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <legend className="fr-fieldset__legend fr-text--bold">
        Votre copropriété
      </legend>
      <div className="fr-my-3w">
        <Field
          type="number"
          name="nombreDeLogement"
          id="nombreDeLogement"
          label="Nombre de logement"
          component={Input}
        />
      </div>
      <div className="fr-my-3w">
        <Field
          name="modeDeChauffage"
          label="Votre mode de chauffage actuel"
          component={Select}
        >
          <option defaultValue="" hidden>
            Selectionnez une option
          </option>
          <option value="fioul">Fioul</option>
          <option value="gaz">Gaz</option>
          <option value="electricite">Electricité</option>
          <option value="autre">Autre</option>
        </Field>
      </div>{' '}
      <div className="fr-my-3w">
        <Field
          name="status"
          label="Votre statut au sein de la copropriété"
          component={Select}
        >
          <option defaultValue="" hidden>
            Selectionnez une option
          </option>
          <option value="membre du conseil">Membre du conseil syndical</option>
          <option value="syndic">Syndic</option>
          <option value="habitant">habitant</option>
          <option value="autre">Autre</option>
        </Field>
      </div>
    </fieldset>
  );
};

export default ContactCoOwnership;
