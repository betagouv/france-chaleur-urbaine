import ContactCoOwnership, {
  defaultValuesContactCoOwnership,
  validationSchemasContactCoOwnership,
} from '@components/contact/contactCoOwnership';
import ContactInformation, {
  defaultValuesContactInformation,
  validationSchemasContactInformation,
} from '@components/contact/contactInformation';
import ContactSource, {
  defaultValuesContactOriginAndDataSection,
  validationSchemasContactSource,
} from '@components/contact/contactSource';
import ContactTopic, {
  defaultValuesContactTopic,
  validationSchemasContactTopic,
} from '@components/contact/contactTopic';
import { Form, Formik } from 'formik';
import React from 'react';
import * as Yup from 'yup';

export const ContactForm = ({ onSubmit }: any) => {
  const initialValues = {
    ...defaultValuesContactTopic,
    ...defaultValuesContactInformation,
    ...defaultValuesContactCoOwnership,
    ...defaultValuesContactOriginAndDataSection,
  };
  const validationSchema = Yup.object({
    ...validationSchemasContactTopic,
    ...validationSchemasContactInformation,
    ...validationSchemasContactCoOwnership,
    ...validationSchemasContactSource,
  });
  const handleSubmit = async (values: any) => {
    onSubmit(values);
  };
  return (
    <Formik
      initialValues={initialValues}
      //validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      <Form>
        <ContactTopic />
        <ContactInformation />
        <ContactCoOwnership />
        <ContactSource />
        <button className="fr-btn" type="submit">
          Envoyer ma demande
        </button>
      </Form>
    </Formik>
  );
};

export default ContactForm;
