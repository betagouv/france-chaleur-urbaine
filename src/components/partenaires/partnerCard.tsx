import {
  FullTextCard,
  TextCard,
} from '@components/partenaires/partnerCard.style';
import React from 'react';

type PartnerCard = {
  image: { url: string; title: string };
  title: string;
  description: string;
  link: string;
};

function PartnerCard({ image, title, description, link }: PartnerCard) {
  let displayFullCard = false;
  const setDisplayFullCard = () => {
    displayFullCard = !displayFullCard;
  };
  return (
    <div className="fr-card">
      {displayFullCard ? (
        <FullTextCard className="fr-card__body">
          <h4 className="fr-card__title">
            <a
              href={link}
              target="_blank"
              className="fr-card__link"
              rel="noreferrer"
            >
              {title}
            </a>
          </h4>
          <p className="fr-card__desc" onClick={setDisplayFullCard}>
            {description}
          </p>
        </FullTextCard>
      ) : (
        <TextCard className="fr-card__body">
          <h4 className="fr-card__title">
            <a
              href={link}
              target="_blank"
              className="fr-card__link"
              rel="noreferrer"
            >
              {title}
            </a>
          </h4>
          <p className="fr-card__desc" onClick={setDisplayFullCard}>
            {description}
          </p>
        </TextCard>
      )}
      <div className="fr-card__img">
        <img src={image.url} className="fr-responsive-img" alt={image.title} />
      </div>
    </div>
  );
}

export default PartnerCard;
