import {
  Alert,
  Button,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  TextInput,
} from '@dataesr/react-dsfr';
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

const additionWishValuesADEME = [
  'Tracé d’un nouveau réseau',
  'Tracé d’une extension d’un réseau existant',
  'Tracé d’un réseau existant',
  'Périmètre de développement prioritaire',
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
  const [nomGestionnaireWish, setNomGestionnaireWish] = useState('');
  const [dateWish, setDateWish] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      (wish === 'Ajout de données' || wish === 'Déposer des éléments') &&
      additionWish.length === 0
    ) {
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
      'Nom gestionnaire': nomGestionnaireWish,
      Date: dateWish,
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
        <Radio
          label="déposer des éléments dans le cadre d’une demande de subvention ADEME"
          value="Déposer des éléments"
        />
      </RadioGroup>
      {wish === 'Ajout de données' && (
        <>
          <CheckboxGroup legend="Vous voulez ajouter" isInline required>
            {additionWishValues.map((value) => (
              <Checkbox
                key={value}
                label={value}
                id={value}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore: Create proper type
                onClick={handleClickAdditionWish}
              />
            ))}
          </CheckboxGroup>
          {additionWish.includes('autre') && (
            <TextInput
              label="Precisez"
              required
              value={otherAdditionWish}
              onChange={(e) => setOtherAdditionWish(e.target.value)}
            />
          )}
        </>
      )}
      {wish &&
        wish !== 'Ajout de données' &&
        wish !== 'Déposer des éléments' && (
          <TextInput
            label="Precisez"
            required
            value={otherWish}
            onChange={(e) => setOtherWish(e.target.value)}
          />
        )}
      {wish === 'Déposer des éléments' && (
        <>
          <TextInput
            label="Nom du gestionnaire du réseau"
            required
            value={nomGestionnaireWish}
            onChange={(e) => setNomGestionnaireWish(e.target.value)}
          />
          <TextInput
            label="Localisation"
            required
            value={otherWish}
            onChange={(e) => setOtherWish(e.target.value)}
          />
          <CheckboxGroup legend="Vous voulez ajouter" isInline required>
            {additionWishValuesADEME.map((value) => (
              <Checkbox
                key={value}
                label={value}
                id={value}
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore: Create proper type
                onClick={handleClickAdditionWish}
              />
            ))}
          </CheckboxGroup>

          {(additionWish.includes('Tracé d’un nouveau réseau') ||
            additionWish.includes(
              'Tracé d’une extension d’un réseau existant'
            )) && (
            <TextInput
              label="Préciser la date de mise en service prévisionnelle"
              required
              value={dateWish}
              onChange={(e) => setDateWish(e.target.value)}
              type="date"
            />
          )}
        </>
      )}
      {additionWishEmpty && (
        <p>
          <Alert
            type="error"
            title={'Merci de sélectionner le type d’ajout.'}
          />
        </p>
      )}
      <Button submit>
        {wish &&
        (wish === 'Ajout de données' || wish === 'Déposer des éléments')
          ? 'Télécharger mes données'
          : 'Envoyer'}
      </Button>
      {((wish === 'Ajout de données' &&
        additionWishValuesWithFormat.some((x) => additionWish.includes(x))) ||
        wish === 'Déposer des éléments') && (
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
