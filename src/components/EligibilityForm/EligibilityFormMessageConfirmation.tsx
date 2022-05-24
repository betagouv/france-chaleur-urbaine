import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';

const UnderlinedLink = styled.a`
  text-decoration: none;
  color: white;
`;
const EligibilityFormMessageConfirmation = () => {
  return (
    <>
      <CallOut>
        <CallOutTitle>
          Votre demande de contact est bien prise en compte.
        </CallOutTitle>
        <CallOutBody>
          L'équipe France Chaleur Urbaine a bien reçu votre demande et reviendra
          vers vous dans les meilleurs délais afin de vous apporter une réponse.
          Dans l'attente, n'hésitez pas à consulter notre{' '}
          <Link href="/ressources">
            <a>centre de ressources</a>
          </Link>
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
