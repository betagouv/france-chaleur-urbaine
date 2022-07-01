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

type ContactFormProps = {
  onSubmit: (values: FormikValues) => void;
  isSubmitting?: boolean; // TODO: remove and replace by 'disable'
};
export const ContactForm = ({
  onSubmit,
  isSubmitting = false,
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
    // const form: any = formRef?.current;
    // console.log(form);
    // if (form) form?.reset();
  };
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
    >
      {(formik) => (
        <Form ref={formRef}>
          <ContactInformation />
          <ContactConsent />
          <ContactFormFooter>
            <button
              className="fr-btn"
              type="submit"
              disabled={!formik.isValid || isSubmitting}
            >
              Envoyer
            </button>
            {!formik.isValid && (
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
