import { fr } from '@codegouvfr/react-dsfr';
import { Field } from 'formik';
import * as Yup from 'yup';

import Checkbox from '@/components/form/formik/checkbox';
import Box from '@/components/ui/Box';

export const fieldLabelConsent = {
  termOfUse: 'J’accepte les conditions générales d’utilisation du service.',
};

export const defaultValuesContactConsent = {
  termOfUse: false,
};

export const validationSchemasContactConsent = {
  termOfUse: Yup.boolean().oneOf([true], 'Ce champ est requis'),
};

const ContactConsent = () => {
  return (
    <fieldset className={fr.cx('fr-fieldset')}>
      <Box className={fr.cx('fr-fieldset__element')} my="1w">
        <Field name="termOfUse" label={fieldLabelConsent.termOfUse} component={Checkbox} />
      </Box>
    </fieldset>
  );
};

export default ContactConsent;
