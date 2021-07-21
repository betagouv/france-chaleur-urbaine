import { TextCard } from '@components/resources/resourceCard.style';
import CustomImage from '@utils/CustomImage';
import React from 'react';

type ResourceCard = {
  image: { url: string; title: string };
  title: string;
  description: string;
  fileLink: string;
};

function ResourceCard({ image, title, description, fileLink }: ResourceCard) {
  return (
    <div className="fr-card">
      <div className="fr-p-3w">
        <TextCard>
          <p className="fr-card__detail">Brochure PDF</p>
          <h4
            className="fr-card__title"
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <p className="fr-card__desc">{description}</p>
        </TextCard>
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
      <CustomImage src={image.url} alt={image.title} width="" height="" />
    </div>
  );
}

export default ResourceCard;
