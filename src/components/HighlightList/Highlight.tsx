import React from 'react';
import { HighlightCard } from './HighlightList.style';

export type HighlightType = {
  title?: string;
  subTitle?: string;
  description?: string;
  icon: string;
  altIcon: string;
};

const Highlight = ({
  title,
  subTitle,
  description,
  icon,
  altIcon,
}: HighlightType) => (
  <HighlightCard>
    <img src={icon} alt={altIcon} />
    <div>
      {title && <h4>{title}</h4>}
      {subTitle && <strong>{subTitle}</strong>}
      {description && <p className="fr-text--lg">{description}</p>}
    </div>
  </HighlightCard>
);

export default Highlight;
