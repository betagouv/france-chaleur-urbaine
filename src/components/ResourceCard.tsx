import React from 'react';

function ResourceCard({
  imageUrl,
  imageTitle,
  sourceTitle,
  sourceDescription,
  fileLink,
}) {
  return (
    <div className="fr-card">
      <div className="fr-p-3w">
        <div style={{ height: '280px' }}>
          <p className="fr-card__detail">Brochure PDF</p>
          <h4 className="fr-card__title">{sourceTitle}</h4>
          <p className="fr-card__desc">{sourceDescription}</p>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--right">
          <div className="fr-col-">
            <a className="fr-btn" href={fileLink} download>
              Télécharger
              <span
                className="fr-fi-file-download-line fr-pl-2w"
                aria-hidden="true"
              />
            </a>
          </div>
        </div>
      </div>
      <div className="fr-card__img">
        <img src={imageUrl} className="fr-responsive-img" alt={imageTitle} />
      </div>
    </div>
  );
}

export default ResourceCard;
