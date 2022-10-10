import MarkdownWrapper from '@components/MarkdownWrapper';
import { AddressDataType } from 'src/types/AddressData';
import styled from 'styled-components';
import { ContactFormEligibilityResult } from './components';

const UnderlinedLink = styled.a`
  text-decoration: none;
  color: white;
`;
const EligibilityFormMessageConfirmation = ({
  addressData = {},
  cardMode,
}: {
  addressData: AddressDataType;
  cardMode?: boolean;
}) => {
  const linkToMap =
    addressData?.geoAddress?.geometry?.coordinates &&
    (!addressData.eligibility?.isBasedOnIris
      ? `./carte/?coord=${addressData.geoAddress.geometry.coordinates}&zoom=15`
      : `https://carto.viaseva.org/public/viaseva/map/?coord=${addressData.geoAddress.geometry.coordinates.reverse()}&zoom=15`);

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
Sans attendre, [téléchargez notre guide pratique](/documentation/guide-france-chaleur-urbaine.pdf) afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.  
Visualisez également notre carte des réseaux de chaleur [ici](${linkToMap}).`,
      bodyCardMode: `
Sans attendre, [téléchargez notre guide pratique](/documentation/guide-france-chaleur-urbaine.pdf) afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.`,
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
