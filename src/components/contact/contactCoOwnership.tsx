import Input from '@components/input';
import Select from '@components/select';
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
        <Field
          name="heatingMethod"
          id="heatingMethod"
          label="Votre mode de chauffage actuel"
          component={Select}
        />
        <ErrorMessage
          name="heatingMethod"
          component={'p'}
          className="fr-error-text"
        />
      </div>

      <div className="fr-my-3w">
        <Field
          name="coOwnershipStatus"
          id="coOwnershipStatus"
          label="Votre statut au sein de la copropriété"
          component={Select}
        />
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
