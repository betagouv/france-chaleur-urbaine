import React from 'react';
import Highlight, { HighlightType } from './Highlight';
import { PageTitle } from './HighlightList.style';

type HighlightListProps = {
  title: string;
  data: HighlightType[];
};

function HighlightList({ title, data = [] }: HighlightListProps) {
  return (
    <div className="fr-my-6w">
      <PageTitle>{title}</PageTitle>
      <div className="fr-container--fluid fr-my-6w">
        <div className="fr-grid-row fr-grid-row--gutters">
          {data?.map(
            ({
              title,
              body,
              subTitle,
              description,
              icon,
              altIcon,
            }: HighlightType) => (
              <div key={icon} className="fr-col-sm">
                <Highlight
                  title={title}
                  body={body}
                  subTitle={subTitle}
                  description={description}
                  icon={icon}
                  altIcon={altIcon}
                />
              </div>
            )
          ) || null}
        </div>
      </div>
    </div>
  );
}

export default HighlightList;
