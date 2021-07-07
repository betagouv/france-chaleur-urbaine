import Checkbox from '@components/checkbox';
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
          label="Comment avez-vous entendu parlé de France chaleur urbaine"
        >
          {({
            field, // { name, value, onChange, onBlur }
            id,
            ...props
          }: any) => (
            <>
              <label className="fr-label" htmlFor={field.name}>
                Comment avez-vous entendu parlé de France chaleur urbaine{' '}
                {field.id}
              </label>

              <select
                className="fr-select"
                {...field}
                {...props}
                id={field.name}
              >
                <option defaultValue="">Selectionnez une option</option>
                <option value="mail">Mail</option>
                <option value="bouche à oreille">Bouche à oreille</option>
                <option value="linkedin">Linkedin</option>
                <option value="google">Google</option>
                <option value="autre">Autre</option>
              </select>
            </>
          )}
        </Field>
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
