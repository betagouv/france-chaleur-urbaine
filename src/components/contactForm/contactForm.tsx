import ContactCoOwnership, {
  defaultValuesContactCoOwnership,
  validationSchemasContactCoOwnership,
} from '@components/contact/contactCoOwnership';
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
    ...defaultValuesContactCoOwnership,
    ...defaultValuesSourceAndDataSection,
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
      <Form>
        <h2>Demande de contact et d’information</h2>
        <ContactTopic />
        <ContactInformation />
        <ContactCoOwnership />
        <ContactSource />
        <button className="fr-btn" type="submit" disabled={isSubmitting}>
          Envoyer ma demande
        </button>
      </Form>
    </Formik>
  );
};

export default ContactForm;
