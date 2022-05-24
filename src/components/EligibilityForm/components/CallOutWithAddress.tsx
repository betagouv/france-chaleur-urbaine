import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import React from 'react';

const CallOutWithAddress = ({
  isAddressEligible,
  addressCoords,
}: {
  isAddressEligible: boolean;
  addressCoords?: [number, number];
}) => {
  const variant = isAddressEligible ? 'success' : 'error';
  return (
    <CallOut variant={variant}>
      {isAddressEligible ? (
        <>
          <CallOutBody>
            Bonne nouvelle ! Un réseau de chaleur passe à proximité de votre
            adresse.
          </CallOutBody>
        </>
      ) : (
        <>
          <CallOutTitle>
            Votre bâtiment n'est pour le moment pas raccordable à un réseau de
            chaleur.
          </CallOutTitle>
          <CallOutBody>
            <p className={'fr-my-2w'}>
              Toutefois, les réseaux se développent et il pourrait le devenir.
            </p>
            {addressCoords && (
              <a
                href={`https://carto.viaseva.org/public/viaseva/map/?coord=${addressCoords}&zoom=15`}
                target="_blank"
                className="fr-text--sm"
                rel="noopener noreferrer"
              >
                Visualiser les réseaux à proximité
              </a>
            )}
          </CallOutBody>
        </>
      )}
    </CallOut>
  );
};

export default CallOutWithAddress;
