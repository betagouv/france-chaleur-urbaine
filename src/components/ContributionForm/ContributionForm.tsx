import { Button, Radio, RadioGroup, TextInput } from '@dataesr/react-dsfr';
import { FormEvent, useState } from 'react';

const ContributionForm = ({ submit }: { submit: (data: any) => void }) => {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState('');
  const [otherUser, setOtherUser] = useState('');
  const [network, setNetwork] = useState('');
  const [wish, setWish] = useState('');
  const [additionWish, setAdditionWish] = useState('');
  const [otherAdditionWish, setOtherAdditionWish] = useState('');
  const [otherWish, setOtherWish] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit({
      Email: email,
      Utilisateur: user === 'autre' ? otherUser : user,
      'Réseau(x)': network,
      Souhait: wish,
      'Ajout de': additionWish === 'autre' ? otherAdditionWish : additionWish,
      Précisions: otherWish,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextInput
        label="Adresse mail"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <RadioGroup
        legend="Vous êtes"
        name="user"
        isInline
        required
        value={user}
        onChange={setUser}
      >
        <Radio label="une collectivité" value="Collectivité" />
        <Radio label="un exploitant" value="Exploitant" />
        <Radio label="autre" value="autre" />
      </RadioGroup>
      {user === 'autre' && (
        <TextInput
          name="otherUser"
          label="Precisez"
          required
          value={otherUser}
          onChange={(e) => setOtherUser(e.target.value)}
        />
      )}
      <TextInput
        label="Réseau(x) concerné(s)"
        required
        value={network}
        onChange={(e) => setNetwork(e.target.value)}
      />
      <RadioGroup
        legend="Vous souhaitez"
        name="wish"
        isInline
        required
        value={wish}
        onChange={setWish}
      >
        <Radio
          label="ajouter des données /informations"
          value="Ajout de données"
        />
        <Radio label="nous signaler une erreur" value="Signaler une erreur" />
        <Radio
          label="nous suggérer une fonctionnalité à ajouter à la carte"
          value="Suggérer une fonctionnalité"
        />
        <Radio
          label="nous indiquer le contact commercial à qui transmettre les demandes de raccordement reçues sur France chaleur Urbaine et relatives à votre réseau"
          value="Indiquer un contact"
        />
      </RadioGroup>
      {wish === 'Ajout de données' && (
        <>
          <RadioGroup
            legend="Vous voulez ajouter"
            name="additionWish"
            isInline
            required
            value={additionWish}
            onChange={setAdditionWish}
          >
            <Radio label="tracé du réseau" value="Tracé du réseau" />
            <Radio
              label="périmètre de la zone de développement prioritaire"
              value="Périmètre de la zone de développement prioritaire"
            />
            <Radio
              label="tracé d'une extension prévue du réseau"
              value="Tracé d'une extension prévue du réseau"
            />
            <Radio
              label="informations tarifaires"
              value="Informations tarifaires"
            />
            <Radio label="autre" value="autre" />
          </RadioGroup>
          {additionWish === 'autre' && (
            <TextInput
              label="Precisez"
              required
              value={otherAdditionWish}
              onChange={(e) => setOtherAdditionWish(e.target.value)}
            />
          )}
        </>
      )}
      {wish && wish !== 'Ajout de données' && (
        <TextInput
          label="Precisez"
          required
          value={otherWish}
          onChange={(e) => setOtherWish(e.target.value)}
        />
      )}
      <Button submit>Suivant</Button>
    </form>
  );
};

export default ContributionForm;
