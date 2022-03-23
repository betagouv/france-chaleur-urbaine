import Checkbox from '@components/shared/checkbox';
import { Field } from 'formik';
import * as Yup from 'yup';

export const fieldLabelConsent = {
  collecterMesDonnees:
    'J’accepte que les données collectées soient utilisées à des fins d’analyse par le ministère de la transition écologique. (*)',
  partageAuGestionnaire:
    'J’accepte que ma demande soit communiquée à ma commune et au gestionnaire du réseau le plus proche (sans aucun engagement de ma part).',
};

export const defaultValuesContactConsent = {
  collecterMesDonnees: false,
  partageAuGestionnaire: false,
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
          label={fieldLabelConsent.collecterMesDonnees}
          component={Checkbox}
        />
      </div>
      <div className="fr-my-3w fr-checkbox-group">
        <Field
          name="partageAuGestionnaire"
          label={fieldLabelConsent.partageAuGestionnaire}
          component={Checkbox}
        />
      </div>
    </fieldset>
  );
};

export default contactConsent;
