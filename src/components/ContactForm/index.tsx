import { Alert, Button, Select, TextInput } from '@dataesr/react-dsfr';
import { submitToAirtable } from '@helpers/airtable';
import { FormEvent, useState } from 'react';
import { Airtable } from 'src/types/enum/Airtable';

const ContactForm = () => {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

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

  return sent ? (
    <Alert
      type="success"
      title="Merci pour votre message"
      description="Nous reviendrons rapidement vers vous."
    />
  ) : (
    <form onSubmit={submit}>
      <TextInput
        required
        label="Votre nom :"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextInput
        required
        label="Votre prénom :"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <TextInput
        required
        type="email"
        label="Votre adresse e-mail :"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextInput
        label="Votre numéro de téléphone :"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Select
        required
        label="Objet du message :"
        options={[
          {
            value: '',
            label: "- Selectionner l'objet de votre message -",
            disabled: true,
            hidden: true,
          },
          {
            value: 'Suivi',
            label: 'Suivre une demande déposée sur France Chaleur Urbaine',
          },
          {
            value: 'question',
            label: 'Poser une question sur les réseaux de chaleur',
          },
          { value: 'partenariat', label: 'Établir un partenariat' },
          { value: 'suggestion', label: 'Faire une suggestion pour le site' },
          { value: 'probleme', label: 'Signaler un problème sur le site' },
          { value: 'autre', label: 'Autre' },
        ]}
        selected={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <TextInput
        required
        textarea
        label="Votre message :"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
      />
      <Button className="fr-mt-2w" submit>
        Envoyer
      </Button>
    </form>
  );
};

export default ContactForm;
