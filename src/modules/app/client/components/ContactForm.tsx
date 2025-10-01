import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { useQueryState } from 'nuqs';
import React from 'react';

import useForm from '@/components/form/react-form/useForm';
import { toastErrors } from '@/modules/notification';
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

  const defaultValues = {
    lastName: '',
    firstName: '',
    email: '',
    phone: '',
    subject: defaultReason || '',
    message: '',
  };

  const { Form, Field, FieldWrapper, Submit, form } = useForm({
    schema: contactFormSchema,
    defaultValues,
    onSubmit: toastErrors(async ({ value }) => {
      await submitContactMutation.mutateAsync(value);
    }),
  });

  const handleNewMessage = () => {
    setSent(false);
    form.reset(defaultValues);
  };

  return (
    <>
      {sent ? (
        <div className="max-w-xl">
          <Alert severity="success" title="Merci pour votre message" description="Nous reviendrons rapidement vers vous." />
          <Button className="fr-mt-2w" onClick={handleNewMessage}>
            Envoyer un nouveau message
          </Button>
        </div>
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
