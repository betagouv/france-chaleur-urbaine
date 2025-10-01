import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { useQueryState } from 'nuqs';
import React from 'react';

import useForm from '@/components/form/react-form/useForm';
import trpc from '@/modules/trpc/client';

import { contactFormSchema, contactReasonOptions } from '../../constants';

const ContactForm = () => {
  const [defaultReason] = useQueryState('reason');
  const [sent, setSent] = React.useState(false);

  const submitContactMutation = trpc.app.contact.create.useMutation({
    onSuccess: () => {
      setSent(true);
    },
  });

  const { Form, Field, FieldWrapper, Submit } = useForm({
    schema: contactFormSchema,
    defaultValues: {
      lastName: '',
      firstName: '',
      email: '',
      phone: '',
      subject: defaultReason || '',
      message: '',
    },
    onSubmit: async ({ value }) => {
      await submitContactMutation.mutateAsync(value);
    },
  });

  return (
    <>
      {sent ? (
        <Alert severity="success" title="Merci pour votre message" description="Nous reviendrons rapidement vers vous." />
      ) : (
        <Form className="max-w-xl">
          <FieldWrapper>
            <Field.Input name="lastName" label="Votre nom :" />
          </FieldWrapper>

          <FieldWrapper>
            <Field.Input name="firstName" label="Votre prénom :" />
          </FieldWrapper>

          <FieldWrapper>
            <Field.EmailInput name="email" label="Votre adresse e-mail :" />
          </FieldWrapper>

          <FieldWrapper>
            <Field.PhoneInput name="phone" label="Votre numéro de téléphone :" />
          </FieldWrapper>

          <FieldWrapper>
            <Field.Select
              name="subject"
              label="Objet du message :"
              options={contactReasonOptions}
              placeholder="- Sélectionner l'objet de votre message -"
            />
          </FieldWrapper>

          <FieldWrapper>
            <Field.Textarea
              name="message"
              label="Votre message :"
              nativeTextAreaProps={{
                rows: 5,
              }}
            />
          </FieldWrapper>
          <FieldWrapper>
            <Submit loading={submitContactMutation.isPending}>Envoyer</Submit>
          </FieldWrapper>
        </Form>
      )}
    </>
  );
};

export default ContactForm;
