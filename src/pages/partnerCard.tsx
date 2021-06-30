import React from 'react';

function PartnerCard({
  imageUrl,
  imageTitle,
  sourceTitle,
  sourceDescription,
  link,
}) {
  return (
    <div className="fr-card fr-enlarge-link">
      <div className="fr-card__body" style={{ height: '280px' }}>
        <h4 className="fr-card__title">
          <a href={link} className="fr-card__link">
            {sourceTitle}
          </a>
        </h4>
        <p className="fr-card__desc">{sourceDescription}</p>
      </div>
      <div className="fr-card__img">
        <img src={imageUrl} className="fr-responsive-img" alt={imageTitle} />
      </div>
    </div>
  );
}

export default PartnerCard;
