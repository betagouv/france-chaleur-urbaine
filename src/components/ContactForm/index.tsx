import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import { useQueryState } from 'nuqs';
import React, { FormEvent, useState } from 'react';

import Input from '@components/form/dsfr/Input';
import { submitToAirtable } from '@helpers/airtable';
import { Airtable } from 'src/types/enum/Airtable';

const ContactForm = () => {
  const [defaultReason] = useQueryState('reason');
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  React.useEffect(() => {
    if (defaultReason) {
      setReason(defaultReason);
    }
  }, [defaultReason]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await submitToAirtable(
      {
        Nom: name,
        Prenom: firstName,
        Email: email,
        Telephone: phone,
        Objet: reason,
        Message: message,
      },
      Airtable.CONTACT
    );
    setSent(true);
  };

  return (
    <>
      {sent ? (
        <Alert severity="success" title="Merci pour votre message" description="Nous reviendrons rapidement vers vous." />
      ) : (
        <form onSubmit={submit} className="fr-col-12 fr-col-md-10 fr-col-lg-8 fr-col-xl-6">
          <Input
            label="Votre nom :"
            nativeInputProps={{
              required: true,
              value: name,
              onChange: (e) => setName(e.target.value),
            }}
          />
          <Input
            label="Votre prénom :"
            nativeInputProps={{
              required: true,
              value: firstName,
              onChange: (e) => setFirstName(e.target.value),
            }}
          />
          <Input
            label="Votre adresse e-mail :"
            nativeInputProps={{
              type: 'email',
              required: true,
              value: email,
              onChange: (e) => setEmail(e.target.value),
            }}
          />
          <Input
            label="Votre numéro de téléphone :"
            nativeInputProps={{
              value: phone,
              onChange: (e) => setPhone(e.target.value),
            }}
          />

          <Select
            label="Objet du message :"
            placeholder="- Sélectionner l'objet de votre message -"
            options={[
              {
                value: 'Suivi',
                label: 'Suivre une demande déposée sur France Chaleur Urbaine',
              },
              {
                value: 'question',
                label: 'Poser une question sur les réseaux de chaleur',
              },
              { value: 'partenariat', label: 'Établir un partenariat' },
              {
                value: 'suggestion',
                label: 'Faire une suggestion pour le site',
              },
              { value: 'probleme', label: 'Signaler un problème sur le site' },
              ...(process.env.NEXT_PUBLIC_FLAG_ENABLE_COMPARATEUR === 'true'
                ? [
                    {
                      value: 'comparateur',
                      label: 'Faire un retour sur le comparateur',
                    },
                  ]
                : []),
              { value: 'autre', label: 'Autre' },
            ]}
            nativeSelectProps={{
              required: true,
              value: reason,
              onChange: (e) => setReason(e.target.value),
            }}
          />
          <Input
            textArea
            label="Votre message :"
            nativeTextAreaProps={{
              required: true,
              value: message,
              onChange: (e) => setMessage(e.target.value),
              rows: 5,
            }}
          />
          <Button className="fr-mt-2w" type="submit">
            Envoyer
          </Button>
        </form>
      )}
    </>
  );
};

export default ContactForm;
