import Checkbox from '@components/shared/checkbox';
import { Field } from 'formik';
import * as Yup from 'yup';

export const fieldLabelConsent = {
  dataRetention:
    'J’accepte que les données collectées soient utilisées à des fins d’analyse par le ministère de la transition écologique. (*)',
  dataSharing:
    'J’accepte que ma demande soit communiquée à ma commune et au gestionnaire du réseau le plus proche (sans aucun engagement de ma part). (*)',
};

export const defaultValuesContactConsent = {
  dataRetention: false,
  dataSharing: false,
};

export const validationSchemasContactConsent = {
  dataRetention: Yup.boolean().oneOf([true], 'Ce champ est requis'),
  dataSharing: Yup.boolean().oneOf([true], 'Ce champ est requis'),
};

const ContactConsent = () => {
  return (
    <fieldset className="fr-fieldset fr-my-3w">
      <div className="fr-my-3w fr-checkbox-group">
        <Field
          name="dataRetention"
          label={fieldLabelConsent.dataRetention}
          component={Checkbox}
        />
      </div>
      <div className="fr-my-3w fr-checkbox-group">
        <Field
          name="dataSharing"
          label={fieldLabelConsent.dataSharing}
          component={Checkbox}
        />
      </div>
    </fieldset>
  );
};

export default ContactConsent;
