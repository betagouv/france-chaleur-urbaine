import React from 'react';

type PartnerCard = {
  image: { url: string; title: string };
  title: string;
  link: string;
};

function PartnerCard({ image, title, link }: PartnerCard) {
  return (
    <div className="fr-enlarge-link">
      <div>
        <a
          href={link}
          target="_blank"
          className="fr-card__link"
          rel="noreferrer nofollow"
          title={title}
        >
          <img
            src={image.url}
            className="fr-responsive-img"
            alt={image.title}
          />
        </a>
      </div>
    </div>
  );
}

export default PartnerCard;
