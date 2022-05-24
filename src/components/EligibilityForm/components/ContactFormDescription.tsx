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

const ContactFormDescription = ({
  isAddressEligible,
}: {
  isAddressEligible: boolean;
}) => {
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
};

export default ContactFormDescription;
