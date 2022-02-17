import {
  CallOut,
  CallOutBody,
  CallOutTitle,
} from '@components/shared/callOut/CallOut';
import React from 'react';

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
  const contentData = isAddressEligible
    ? {
        title: `Avec le service public France Chaleur Urbaine, bénéficiez d’un
      accompagnement personnalisé, gratuit et sans engagement !`,
        details: [
          `Nous vous donnons toutes les informations nécessaires sur le réseau de
        chaleur qui passe près de chez vous`,
          `Nous vous accompagnons dans les démarches à accomplir si vous
        souhaitez y raccorder votre copropriété`,
        ],
      }
    : {
        title: `Vous souhaitez en savoir plus sur les projets de réseaux dans votre quartier ou sur d’autres modes de chauffage vertueux ?
      France Chaleur Urbaine vous recontacte pour :`,
        details: [
          `Vous faire découvrir les projets de création ou extension de réseau dans votre quartier`,
          `Vous informer sur d’autres solutions de chauffage performantes et écologiques`,
        ],
      };

  return (
    <>
      <h4>{contentData.title}</h4>
      <ul>
        {contentData.details.map((detail, i) => (
          <li key={i} className="fr-fi-checkbox-circle-fill">
            {detail}
          </li>
        ))}
      </ul>
    </>
  );
}
