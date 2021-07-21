import { BoxImage, HighlightCard } from '@components/adventage/adventage.style';
import CustomImage from '@utils/CustomImage';
import React from 'react';
type highlight = {
  title: string;
  subTitle: string;
  description: string;
  icon: string;
  altIcon: string;
};
function Highlight({ title, subTitle, description, icon, altIcon }: highlight) {
  return (
    <HighlightCard>
      <BoxImage>
        <CustomImage src={icon} alt={altIcon} width="70px" height="70px" />
      </BoxImage>
      <div className="fr-highlight fr-col fr-mx-4w fr-my-2w">
        <h4>{title}</h4>
        <strong>{subTitle}</strong>
        <p>{description}</p>
      </div>
    </HighlightCard>
  );
}

export default Highlight;
