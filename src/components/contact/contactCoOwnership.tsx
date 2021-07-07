import Input from '@components/input';
import { ErrorMessage, Field } from 'formik';
import * as Yup from 'yup';

export const defaultValuesContactCoOwnership = {
  housingNumber: '',
  heatingMethod: '',
  coOwnershipStatus: '',
};
export const validationSchemasContactCoOwnership = {
  housingNumber: Yup.number().moreThan(0).required('Required'),
  heatingMethod: Yup.string().required('Required'),
  coOwnershipStatus: Yup.string().required('Required'),
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
          name="housingNumber"
          id="housingNumber"
          label="Nombre de logement"
          component={Input}
        />
        <ErrorMessage
          name="housingNumber"
          component={'p'}
          className="fr-error-text"
        />
      </div>

      <div className="fr-my-3w">
        <Field name="heatingMethod" label="Votre mode de chauffage actuel">
          {({
            field, // { name, value, onChange, onBlur }
            ...props
          }: any) => (
            <>
              <label className="fr-label" htmlFor={field.name}>
                Votre mode de chauffage actuel
              </label>
              <select
                className="fr-select"
                {...field}
                {...props}
                id={field.name}
              >
                <option defaultValue="">Selectionnez une option</option>
                <option value="fioul">Fioul</option>
                <option value="gaz">Gaz</option>
                <option value="electricite">Electricité</option>
                <option value="autre">Autre</option>
              </select>
            </>
          )}
        </Field>
        <ErrorMessage
          name="heatingMethod"
          component={'p'}
          className="fr-error-text"
        />
      </div>

      <div className="fr-my-3w">
        <Field
          name="coOwnershipStatus"
          label="Votre statut au sein de la copropriété"
        >
          {({
            field, // { name, value, onChange, onBlur }
            ...props
          }: any) => (
            <>
              <label className="fr-label" htmlFor={field.name}>
                Votre statut au sein de la copropriété
              </label>

              <select
                className="fr-select"
                {...field}
                {...props}
                id={field.name}
              >
                <option defaultValue="">Selectionnez une option</option>
                <option value="membre du conseil">
                  Membre du conseil syndical
                </option>
                <option value="syndic">Syndic</option>
                <option value="habitant">habitant</option>
                <option value="autre">Autre</option>
              </select>
            </>
          )}
        </Field>
        <ErrorMessage
          name="coOwnershipStatus"
          component={'p'}
          className="fr-error-text"
        />
      </div>
    </fieldset>
  );
};

export default ContactCoOwnership;
