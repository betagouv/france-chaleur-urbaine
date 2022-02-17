import { Form, Formik, FormikValues } from 'formik';
import React from 'react';
import * as Yup from 'yup';
import ContactConsent, {
  defaultValuesContactConsent,
  validationSchemasContactConsent,
} from './components/contactConsent';
import ContactInformation, {
  defaultValuesContactInformation,
  validationSchemasContactInformation,
} from './components/contactInformation';

type ContactFormProps = {
  onSubmit: (values: FormikValues) => void;
  isSubmitting: boolean;
};
export const ContactForm = ({
  onSubmit,
  isSubmitting = false,
}: ContactFormProps) => {
  const initialValues = {
    ...defaultValuesContactInformation,
    ...defaultValuesContactConsent,
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
        <Form>
          <ContactInformation />
          <ContactConsent />
          <button
            className="fr-btn"
            type="submit"
            disabled={!formik.isValid || isSubmitting}
          >
            Envoyer
          </button>
          {!formik.isValid && (
            <p className="fr-error-text">
              Veuillez remplir les champs obligatoires(*) avant d'envoyer votre
              demande
            </p>
          )}
        </Form>
      )}
    </Formik>
  );
};

export default ContactForm;
