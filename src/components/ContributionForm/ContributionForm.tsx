import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons';
import Input from '@components/form/Input';
import { ChangeEvent, FormEvent, useState } from 'react';

const additionWishValuesWithFormat = [
  'Tracé du réseau',
  'Périmètre de développement prioritaire',
  "Tracé d'une extension prévue du réseau",
];

const additionWishValues = [
  ...additionWishValuesWithFormat,
  'Informations tarifaires',
  'autre',
];

const ContributionForm = ({ submit }: { submit: (data: any) => void }) => {
  const [email, setEmail] = useState('');
  const [user, setUser] = useState('');
  const [otherUser, setOtherUser] = useState('');
  const [network, setNetwork] = useState('');
  const [wish, setWish] = useState('');
  const [additionWish, setAdditionWish] = useState<string[]>([]);
  const [otherAdditionWish, setOtherAdditionWish] = useState('');
  const [additionWishEmpty, setAdditionWishEmpty] = useState(false);
  const [otherWish, setOtherWish] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (wish === 'Ajout de données' && additionWish.length === 0) {
      setAdditionWishEmpty(true);
      return;
    }
    setAdditionWishEmpty(false);
    submit({
      Email: email,
      Utilisateur: user === 'autre' ? otherUser : user,
      'Réseau(x)': network,
      Souhait: wish,
      'Ajout de': additionWish
        .map((value) =>
          value === 'autre' ? `Autre : ${otherAdditionWish}` : value
        )
        .join(', '),
      Précisions: otherWish,
    });
  };

  const handleClickAdditionWish = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.checked) {
      setAdditionWish(additionWish.filter((value) => value !== e.target.name));
    } else {
      setAdditionWish(Array.from(new Set([...additionWish, e.target.name])));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Adresse mail"
        nativeInputProps={{
          type: 'email',
          required: true,
          value: email,
          onChange: (e) => setEmail(e.target.value),
        }}
      />
      <RadioButtons
        legend="Vous êtes"
        name="user"
        options={[
          {
            label: 'une collectivité',
            nativeInputProps: {
              checked: user === 'Collectivité',
              onChange: () => setUser('Collectivité'),
            },
          },
          {
            label: 'un exploitant',
            nativeInputProps: {
              checked: user === 'Exploitant',
              onChange: () => setUser('Exploitant'),
            },
          },
          {
            label: 'autre',
            nativeInputProps: {
              checked: user === 'autre',
              onChange: () => setUser('autre'),
            },
          },
        ]}
      />

      {user === 'autre' && (
        <Input
          label="Precisez"
          nativeInputProps={{
            name: 'otherUser',
            required: true,
            value: otherUser,
            onChange: (e) => setOtherUser(e.target.value),
          }}
        />
      )}
      <Input
        label="Réseau(x) concerné(s)"
        nativeInputProps={{
          required: true,
          value: network,
          onChange: (e) => setNetwork(e.target.value),
        }}
      />
      <RadioButtons
        legend="Vous souhaitez"
        name="wish"
        options={[
          {
            label: 'ajouter des données /informations',
            nativeInputProps: {
              checked: wish === 'Ajout de données',
              onChange: () => setWish('Ajout de données'),
            },
          },
          {
            label: 'nous signaler une erreur',
            nativeInputProps: {
              checked: wish === 'Signaler une erreur',
              onChange: () => setWish('Signaler une erreur'),
            },
          },
          {
            label: 'nous suggérer une fonctionnalité à ajouter à la carte',
            nativeInputProps: {
              checked: wish === 'Suggérer une fonctionnalité',
              onChange: () => setWish('Suggérer une fonctionnalité'),
            },
          },
          {
            label:
              'nous indiquer le contact commercial à qui transmettre les demandes de raccordement reçues sur France chaleur Urbaine et relatives à votre réseau',
            nativeInputProps: {
              checked: wish === 'Indiquer un contact',
              onChange: () => setWish('Indiquer un contact'),
            },
          },
        ]}
      />
      {wish === 'Ajout de données' && (
        <>
          <Checkbox
            legend="Vous voulez ajouter"
            orientation="horizontal"
            options={additionWishValues.map((value) => {
              return {
                label: value,
                nativeInputProps: {
                  name: value,
                  onChange: (e) => handleClickAdditionWish(e), // TODO: vérifier fonctionnmement
                  value,
                },
              };
            })}
          />
          {additionWish.includes('autre') && (
            <Input
              label="Precisez"
              nativeInputProps={{
                required: true,
                value: otherAdditionWish,
                onChange: (e) => setOtherAdditionWish(e.target.value),
              }}
            />
          )}
        </>
      )}
      {wish && wish !== 'Ajout de données' && (
        <Input
          label="Precisez"
          nativeInputProps={{
            required: true,
            value: otherWish,
            onChange: (e) => setOtherWish(e.target.value),
          }}
        />
      )}
      {additionWishEmpty && (
        <p>
          <Alert
            title={'Merci de sélectionner le type d’ajout.'}
            severity="error"
          />
        </p>
      )}
      <Button
        nativeButtonProps={{
          type: 'submit',
        }}
      >
        {wish && wish === 'Ajout de données'
          ? 'Télécharger mes données'
          : 'Envoyer'}
      </Button>
      {wish === 'Ajout de données' &&
        additionWishValuesWithFormat.some((x) => additionWish.includes(x)) && (
          <span className="fr-hint-text">
            Formats acceptés : .shp, gpkg (geopackage), .geojson, .dxf, .gdb,
            .tab, .kmz <br />A défaut, un .dwg peut être transmis, mais il ne
            pourra être exploité que s'il est géolocalisé
          </span>
        )}
    </form>
  );
};

export default ContributionForm;
