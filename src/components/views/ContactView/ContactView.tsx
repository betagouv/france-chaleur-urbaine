import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import React from 'react';

const contentDataEligible = {
  title: `Avec le service public France Chaleur Urbaine, bénéficiez d’un accompagnement gratuit et sans engagement !`,
  details: [
    `Nous vous informons sur les démarches à accomplir pour se raccorder à un réseau de chaleur`,
    `Nous vous mettons en contact avec le gestionnaire du réseau qui passe près de chez vous`,
  ],
};

const contentDataIneligible = {
  title: `Vous souhaiteriez vous raccorder mais il n'existe pas de réseau de
    chaleur près de chez vous ? Laissez-nous vos coordonnées :`,
  details: [
    `Nous transmettrons votre demande à la mairie de votre commune ou au gestionnaire du réseau le plus proche.`,
    `Faire connaître son souhait de se raccorder, c'est contribuer à la création de nouveaux réseaux de chaleur ou au développement des réseaux existants`,
  ],
};

export function CallOutWithAddress({
  isAddressEligible,
  address,
}: {
  isAddressEligible: boolean;
  address: Record<string, string | number[]> | null;
}) {
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
            Votre copropriété n'est pour le moment pas raccordable à un réseau
            de chaleur.
          </CallOutTitle>
          <CallOutBody>
            <p className={'fr-my-2w'}>
              Toutefois, les réseaux se développent et elle pourrait le devenir.
            </p>
            <a
              href={`https://carto.viaseva.org/public/viaseva/map/?coord=${address?.coords}&zoom=15`}
              target="_blank"
              className="fr-text--sm"
              rel="noopener noreferrer"
            >
              Visualiser les réseaux à proximité
            </a>
          </CallOutBody>
        </>
      )}
    </CallOut>
  );
}

export function ContactFormDescription({
  isAddressEligible,
}: {
  isAddressEligible: boolean;
}) {
  const { title, details } = isAddressEligible
    ? contentDataEligible
    : contentDataIneligible;

  return (
    <>
      <h4>{title}</h4>
      <ul>
        {details.map((detail, i) => (
          <li
            key={i}
            className={` ${
              isAddressEligible
                ? 'fr-fi-checkbox-circle-fill eligible'
                : 'fr-fi-arrow-right-s-line ineligible'
            }`}
          >
            {detail}
          </li>
        ))}
      </ul>
    </>
  );
}
