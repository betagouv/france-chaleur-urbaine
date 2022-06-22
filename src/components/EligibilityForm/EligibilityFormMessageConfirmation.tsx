import MarkdownWrapper from '@components/MarkdownWrapper';
import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import { isIDF } from '@helpers';
import React, { useMemo } from 'react';
import styled from 'styled-components';

// TODO: Extract and import
type AvailableHeating = 'collectif' | 'individuel' | undefined;
type AvailableStructure = 'Tertiaire' | 'Copropriété' | undefined;
type AddressDataType = {
  geoAddress?: Record<string, any>;
  eligibility?: boolean;
  computEligibility?: boolean;
  chauffage?: AvailableHeating;
  network?: Record<string, any>;
  structure?: AvailableStructure;
};

const UnderlinedLink = styled.a`
  text-decoration: none;
  color: white;
`;
const EligibilityFormMessageConfirmation = ({
  addressData = {},
}: {
  addressData: AddressDataType;
}) => {
  const addressCoords: [number, number] = useMemo(() => {
    const coords = addressData?.geoAddress?.geometry?.coordinates;
    return coords && [...coords].reverse();
  }, [addressData]);

  const isIDFAddress = useMemo(() => {
    const { postcode: postCode } = addressData?.geoAddress?.properties || {};
    return postCode && isIDF(postCode);
  }, [addressData]);

  const linkToMap =
    addressCoords &&
    (isIDFAddress
      ? `./carte/?coord=${addressCoords}&zoom=15`
      : `https://carto.viaseva.org/public/viaseva/map/?coord=${addressCoords}&zoom=15`);

  const { structure, computEligibility } = addressData;

  const message = {
    ineligible: {
      title: 'Votre demande de contact est bien prise en compte.',
      body: `Visualisez notre carte des réseaux de chaleur [ici](${linkToMap}).`,
    },
    eligible: {
      title: 'Votre demande de contact est bien prise en compte.',
      body: `
Sans attendre, [téléchargez notre guide pratique](/documentation/guide-france-chaleur-urbaine.pdf) afin d'en savoir plus sur les étapes d'un raccordement et les aides financières mobilisables.  
Visualisez également notre carte des réseaux de chaleur [ici](${linkToMap}).`,
    },
  };
  return (
    <>
      <CallOut>
        <CallOutTitle>
          <MarkdownWrapper
            value={
              structure
                ? message?.[computEligibility ? 'eligible' : 'ineligible']
                    ?.title
                : ''
            }
          />
        </CallOutTitle>
        <CallOutBody>
          <MarkdownWrapper
            value={
              structure
                ? message?.[computEligibility ? 'eligible' : 'ineligible']?.body
                : ''
            }
          />
        </CallOutBody>
      </CallOut>
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
