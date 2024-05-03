import Loader from '@components/Loader';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Form, Formik, FormikValues } from 'formik';
import { useRouter } from 'next/router';
import { useRef } from 'react';
import * as Yup from 'yup';
import ContactConsent, {
  defaultValuesContactConsent,
  validationSchemasContactConsent,
} from './ContactConsent';
import ContactInformation, {
  defaultValuesContactInformation,
  validationSchemasContactInformation,
} from './ContactInformation';
import { ContactFormFooter } from './EligibilityForm.styled';
import { AnalyticsFormId } from 'src/services/analytics';

type ContactFormProps = {
  onSubmit: (values: FormikValues) => void;
  isLoading?: boolean;
  cardMode?: boolean;
  city?: string;
};
export const ContactForm = ({
  onSubmit,
  isLoading,
  cardMode,
  city,
}: ContactFormProps) => {
  const formRef = useRef(null);
  const router = useRouter();

  const getDefaultStructure = () => {
    switch (router.pathname) {
      case '/coproprietaire':
        return 'Copropriété';
      case '/tertiaire':
        return 'Tertiaire';
      default:
        return '';
    }
  };

  const initialValues = {
    ...defaultValuesContactInformation,
    ...defaultValuesContactConsent,
    structure: getDefaultStructure(),
  };
  const validationSchema = Yup.object({
    ...validationSchemasContactInformation,
    ...validationSchemasContactConsent,
  });
  const handleSubmit = async (values: FormikValues) => {
    onSubmit({ ...values });
  };
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Form id={AnalyticsFormId.form_contact} ref={formRef}>
          <ContactInformation cardMode={cardMode} city={city} />
          <ContactConsent />
          <ContactFormFooter>
            {isLoading ? (
              <Loader color="#4550e5" show />
            ) : (
              <Button type="submit" disabled={isLoading}>
                Envoyer
              </Button>
            )}
            {formik.isSubmitting && !formik.isValid && (
              <p className="fr-error-text">
                Veuillez remplir les champs obligatoires(*) avant d'envoyer
                votre demande
              </p>
            )}
          </ContactFormFooter>
        </Form>
      )}
    </Formik>
  );
};

export default ContactForm;
