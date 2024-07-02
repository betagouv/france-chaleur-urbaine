import { Button } from '@codegouvfr/react-dsfr/Button';
import Loader from '@components/Loader';
import { Form, Formik } from 'formik';
import { useRouter } from 'next/router';
import { ReactNode, useRef } from 'react';
import { AnalyticsFormId } from 'src/services/analytics';
import { ContactFormInfos } from 'src/types/Summary/Demand';
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

type ContactFormProps = {
  onSubmit: (values: ContactFormInfos) => void;
  isLoading?: boolean;
  cardMode?: boolean;
  city?: string;
  heatingTypeInput?: ReactNode; // gets inserted after the building type (structure), used in the network page
};
export const ContactForm = ({
  onSubmit,
  isLoading,
  cardMode,
  city,
  heatingTypeInput,
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
  const handleSubmit = async (values: ContactFormInfos) => {
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
          <ContactInformation
            cardMode={cardMode}
            city={city}
            heatingTypeInput={heatingTypeInput}
          />
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
