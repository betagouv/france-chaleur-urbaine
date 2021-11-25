import ContactInformation, {
  defaultValuesContactInformation,
  validationSchemasContactInformation,
} from '@components/contact/contactInformation';
import ContactSource, {
  defaultValuesSourceAndDataSection,
  validationSchemasContactSource,
} from '@components/contact/contactSource';
import ContactTopic, {
  defaultValuesContactTopic,
  validationSchemasContactTopic,
} from '@components/contact/contactTopic';
import { Form, Formik, FormikValues } from 'formik';
import React from 'react';
import * as Yup from 'yup';

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
    ...defaultValuesSourceAndDataSection,
  };
  const validationSchema = Yup.object({
    ...validationSchemasContactTopic,
    ...validationSchemasContactInformation,
    ...validationSchemasContactSource,
  });
  const handleSubmit = async (values: FormikValues) => {
    onSubmit({ ...values });
  };
  return (
    <>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {(formik) => (
          <Form>
            <ContactInformation />
            <ContactTopic />
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
                Veuillez remplir les champs obligatoires(*) avant d'envoyer
                votre demande
              </p>
            )}
          </Form>
        )}
      </Formik>
    </>
  );
};

export default ContactForm;
