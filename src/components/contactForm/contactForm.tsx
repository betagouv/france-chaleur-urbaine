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
      {(formik) => (
        <Form>
          <p>Vous pouvez compléter le formulaire ci-dessous pour :</p>
          <ul className="fr-mb-4w">
            <li>obtenir des informations sur les réseaux de chaleur</li>
            <li>pouvoir échanger avec des copropriétés déjà raccordées</li>
            <li>
              être mis en relation avec l'exploitant du réseau qui passe près de
              chez vous
            </li>
            <li>toute autre information</li>
          </ul>
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
