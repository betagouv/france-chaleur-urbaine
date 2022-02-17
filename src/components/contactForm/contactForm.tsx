import { Form, Formik, FormikValues } from 'formik';
import React from 'react';
import * as Yup from 'yup';
import ContactCoOwnership, {
  defaultValuesContactCoOwnership,
  validationSchemasContactCoOwnership,
} from './components/contactCoOwnership';
import ContactInformation, {
  defaultValuesContactInformation,
  validationSchemasContactInformation,
} from './components/contactInformation';
import ContactSource, {
  defaultValuesContactSource,
  validationSchemasContactSource,
} from './components/contactSource';
import ContactTopic, {
  defaultValuesContactTopic,
  validationSchemasContactTopic,
} from './components/contactTopic';

type ContactFormProps = {
  onSubmit: (values: FormikValues) => void;
  isSubmitting: boolean;
};
export const ContactForm = ({
  onSubmit,
  isSubmitting = false,
}: ContactFormProps) => {
  const initialValues = {
    ...defaultValuesContactTopic,
    ...defaultValuesContactInformation,
    ...defaultValuesContactCoOwnership,
    ...defaultValuesContactSource,
  };
  const validationSchema = Yup.object({
    ...validationSchemasContactTopic,
    ...validationSchemasContactInformation,
    ...validationSchemasContactCoOwnership,
    ...validationSchemasContactSource,
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
          <h2>Demande de contact et d’information</h2>
          <ContactTopic />
          <ContactInformation />
          <ContactCoOwnership />
          <ContactSource />
          <button
            className="fr-btn"
            type="submit"
            disabled={!formik.isValid || isSubmitting}
          >
            Envoyer ma demande
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
