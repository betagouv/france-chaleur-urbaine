import MarkdownWrapper from '@components/MarkdownWrapper';
import {
  Alert,
  Button,
  Checkbox,
  CheckboxGroup,
  TextInput,
} from '@dataesr/react-dsfr';
import { updateAirtable } from '@helpers/airtable';
import { ChangeEvent, FormEvent, useState } from 'react';
import { AddressDataType } from 'src/types/AddressData';
import { Airtable } from 'src/types/enum/Airtable';
import styled from 'styled-components';
import { ContactFormEligibilityResult } from './components';

const UnderlinedLink = styled.a`
  text-decoration: none;
  color: white;
`;

const choices = [
  'Moteur de recherche',
  'Pub web',
  'Article',
  'Pub télé',
  "Bureau d'étude",
  'Espace France Rénov’',
  'Bouche à oreille',
  'Services municipaux',
  'Webinaire',
];

const EligibilityFormMessageConfirmation = ({
  addressData = {},
  cardMode,
}: {
  addressData: AddressDataType;
  cardMode?: boolean;
}) => {
  const [other, setOther] = useState('');
  const [sondage, setSondage] = useState<string[]>([]);
  const [sondageAnswered, setSondageAnswered] = useState(false);
  const answer = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.checked) {
      setSondage(sondage.filter((value) => value !== e.target.name));
    } else {
      setSondage(Array.from(new Set([...sondage, e.target.name])));
    }
  };

  const sendSondage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (addressData.airtableId) {
      await updateAirtable(
        addressData.airtableId,
        {
          sondage: sondage.includes('Autre') ? [...sondage, other] : sondage,
        },
        Airtable.UTILISATEURS
      );
      setSondageAnswered(true);
    }
  };

  const linkToMap =
    addressData?.geoAddress?.geometry?.coordinates &&
    `./carte/?coord=${addressData.geoAddress.geometry.coordinates}&zoom=15`;

  const { structure, computedEligibility } = addressData;

  const message = {
    ineligible: {
      title: 'Votre demande de contact est bien prise en compte.',
      body: `Visualisez notre carte des réseaux de chaleur [ici](${linkToMap}).`,
      bodyCardMode: '',
    },
    eligible: {
      title: 'Votre demande de contact est bien prise en compte.',
      body: `
Seul le gestionnaire du réseau pourra vous confirmer la faisabilité technique et les délais du raccordement.
Sans attendre, :extra-link[téléchargez notre guide pratique]{href="/documentation/guide-france-chaleur-urbaine.pdf" eventKey="'Téléchargement|Guide FCU|Confirmation éligibilité'" target="_blank"} afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.<br />
Visualisez également notre carte des réseaux de chaleur [ici](${linkToMap}).`,
      bodyCardMode: `
Seul le gestionnaire du réseau pourra vous confirmer la faisabilité technique et les délais du raccordement.
Sans attendre, :extra-link[téléchargez notre guide pratique]{href="/documentation/guide-france-chaleur-urbaine.pdf" eventKey="'Téléchargement|Guide FCU|Confirmation éligibilité'" target="_blank"} afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.`,
    },
  };
  return (
    <>
      <ContactFormEligibilityResult cardMode={cardMode}>
        <header>
          <MarkdownWrapper
            value={
              structure
                ? message?.[computedEligibility ? 'eligible' : 'ineligible']
                    ?.title
                : ''
            }
          />
        </header>
        <MarkdownWrapper
          value={
            structure
              ? message?.[computedEligibility ? 'eligible' : 'ineligible']?.[
                  cardMode ? 'bodyCardMode' : 'body'
                ]
              : ''
          }
        />
      </ContactFormEligibilityResult>
      {addressData.airtableId &&
        (sondageAnswered ? (
          <Alert type="success" title="Merci pour votre contribution"></Alert>
        ) : (
          <div className="fr-grid-row fr-grid-row--center fr-mt-5w">
            <form onSubmit={sendSondage}>
              <h4>Aidez-nous à améliorer notre service :</h4>
              <CheckboxGroup
                legend="Comment avez-vous connu France Chaleur Urbaine ?"
                required
              >
                {choices.map((choice) => (
                  <Checkbox
                    key={choice}
                    label={choice}
                    id={choice}
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore: Create proper type
                    onClick={answer}
                  />
                ))}
                <Checkbox
                  label="Autre"
                  id="Autre"
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-ignore: Create proper type
                  onClick={answer}
                />
                {sondage.includes('Autre') && (
                  <TextInput
                    required
                    value={other}
                    placeholder="Veuillez préciser"
                    onChange={(e) => setOther(e.target.value)}
                  />
                )}
              </CheckboxGroup>
              <Button submit>Valider</Button>
            </form>
          </div>
        ))}
      <div className="fr-grid-row fr-grid-row--center fr-mt-5w">
        <UnderlinedLink
          className="fr-md-auto"
          href={process.env.NEXT_PUBLIC_FEEDBACK_URL}
          target="_blank"
        >
          <img
            src="https://voxusagers.numerique.gouv.fr/static/bouton-bleu.svg"
            alt="Je donne mon avis"
            title="Je donne mon avis sur cette démarche"
          />
        </UnderlinedLink>
      </div>
    </>
  );
};

export default EligibilityFormMessageConfirmation;
