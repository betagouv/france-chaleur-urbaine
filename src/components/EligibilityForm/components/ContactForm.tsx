import Loader from '@components/Loader';
import { Button } from '@dataesr/react-dsfr';
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
import {
  ContactFormFooter,
  FormFreezer,
  FormWrapper,
} from './EligibilityForm.styled';

type ContactFormProps = {
  onSubmit: (values: FormikValues) => void;
  isLoading?: boolean;
};
export const ContactForm = ({ onSubmit, isLoading }: ContactFormProps) => {
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
        <FormWrapper>
          <Form ref={formRef}>
            <ContactInformation />
            <ContactConsent />
            <ContactFormFooter>
              {isLoading ? (
                <Loader color="#4550e5" show />
              ) : (
                <Button submit disabled={!formik.isValid || isLoading}>
                  Envoyer
                </Button>
              )}
              {!formik.isValid && (
                <p className="fr-error-text">
                  Veuillez remplir les champs obligatoires(*) avant d'envoyer
                  votre demande
                </p>
              )}
            </ContactFormFooter>
            <FormFreezer enabled={isLoading} />
          </Form>
        </FormWrapper>
      )}
    </Formik>
  );
};

export default ContactForm;
