import { TextCard } from '@components/partenaires/partnerCard.style';
import Image from 'next/image';
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
      <Image
        src={image.url}
        alt={image.title}
        title={image.title}
        width="360px"
        height="200px"
      />
    </div>
  );
}

export default PartnerCard;
