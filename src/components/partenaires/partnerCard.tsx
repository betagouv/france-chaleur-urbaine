import { TextCard } from '@components/partenaires/partnerCard.style';
import React from 'react';

type PartnerCard = {
  image: { url: string; title: string };
  title: string;
  description: string;
  link: string;
};

function PartnerCard({ image, title, description, link }: PartnerCard) {
  return (
    <div className="fr-card fr-enlarge-link">
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
        <p className="fr-card__desc">{description}</p>
      </TextCard>
      <div className="fr-card__img">
        <img src={image.url} className="fr-responsive-img" alt={image.title} />
      </div>
    </div>
  );
}

export default PartnerCard;
