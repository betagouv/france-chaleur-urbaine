import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox';
import { type FormEvent, useState } from 'react';
import styled from 'styled-components';

import Input from '@/components/form/dsfr/Input';
import MarkdownWrapper from '@/components/MarkdownWrapper';
import { updateAirtable } from '@/services/airtable';
import type { AddressDataType } from '@/types/AddressData';
import { Airtable } from '@/types/enum/Airtable';

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
  'Autre',
] as const;

type Choice = (typeof choices)[number];

const EligibilityFormMessageConfirmation = ({ addressData = {}, cardMode }: { addressData: AddressDataType; cardMode?: boolean }) => {
  const [other, setOther] = useState('');
  const [sondage, setSondage] = useState<string[]>([]);
  const [sondageAnswered, setSondageAnswered] = useState(false);
  const answer = (choice: Choice, checked: boolean) => {
    if (!checked) {
      setSondage(sondage.filter((value) => value !== choice));
    } else {
      setSondage(Array.from(new Set([...sondage, choice])));
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
        Airtable.DEMANDES
      );
      setSondageAnswered(true);
    }
  };

  const linkToMap =
    addressData?.geoAddress?.geometry?.coordinates && `./carte/?coord=${addressData.geoAddress.geometry.coordinates}&zoom=15`;

  const { structure, computedEligibility } = addressData;

  const message = {
    eligible: {
      body: `
Seul le gestionnaire du réseau pourra vous confirmer la faisabilité technique et les délais du raccordement.
Sans attendre, :extra-link[téléchargez notre guide pratique]{href="/documentation/guide-france-chaleur-urbaine.pdf" eventKey="'Téléchargement|Guide FCU|Confirmation éligibilité'" target="_blank"} afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.<br />
Visualisez également notre carte des réseaux de chaleur [ici](${linkToMap}).`,
      bodyCardMode: `
Seul le gestionnaire du réseau pourra vous confirmer la faisabilité technique et les délais du raccordement.
Sans attendre, :extra-link[téléchargez notre guide pratique]{href="/documentation/guide-france-chaleur-urbaine.pdf" eventKey="'Téléchargement|Guide FCU|Confirmation éligibilité'" target="_blank"} afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.`,
      title: 'Votre demande de contact est bien prise en compte.',
    },
    ineligible: {
      body: `Visualisez notre carte des réseaux de chaleur [ici](${linkToMap}).`,
      bodyCardMode: '',
      title: 'Votre demande de contact est bien prise en compte.',
    },
  };
  return (
    <>
      <ContactFormEligibilityResult cardMode={cardMode}>
        <header>
          <MarkdownWrapper value={structure ? message?.[computedEligibility ? 'eligible' : 'ineligible']?.title : ''} />
        </header>
        <MarkdownWrapper
          value={structure ? message?.[computedEligibility ? 'eligible' : 'ineligible']?.[cardMode ? 'bodyCardMode' : 'body'] : ''}
        />
      </ContactFormEligibilityResult>
      {addressData.airtableId &&
        (sondageAnswered ? (
          <Alert severity="success" title="Merci pour votre contribution" />
        ) : (
          <div className="fr-grid-row fr-grid-row--center fr-mt-5w">
            <form onSubmit={sendSondage}>
              <h4>Aidez-nous à améliorer notre service :</h4>

              <Checkbox
                legend="Comment avez-vous connu France Chaleur Urbaine ?"
                options={choices.map((choice) => ({
                  label: choice,
                  nativeInputProps: {
                    onClick: (e) => answer(choice, (e.target as any).checked),
                  },
                }))}
              />
              {sondage.includes('Autre') && (
                <Input
                  label=""
                  nativeInputProps={{
                    onChange: (e) => setOther(e.target.value),
                    placeholder: 'Veuillez préciser',
                    required: true,
                    value: other,
                  }}
                />
              )}
              <Button type="submit">Valider</Button>
            </form>
          </div>
        ))}
      <div className="fr-grid-row fr-grid-row--center fr-mt-5w">
        <UnderlinedLink className="fr-md-auto" href={process.env.NEXT_PUBLIC_FEEDBACK_URL} target="_blank">
          <img
            src="https://voxusagers.numerique.gouv.fr/static/bouton-bleu.svg"
            alt="Je donne mon avis"
            title="Je donne mon avis sur cette démarche"
            loading="lazy"
          />
        </UnderlinedLink>
      </div>
    </>
  );
};

export default EligibilityFormMessageConfirmation;
