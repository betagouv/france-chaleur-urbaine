import Highlight, { HighlightType } from './Highlight';
import {
  HighlightListWrapper,
  HighlightWrapper,
  PageTitle,
} from './HighlightList.style';

type HighlightListProps = {
  title?: string;
  data: HighlightType[];
};

function HighlightList({ title, data = [] }: HighlightListProps) {
  return (
    <div className="fr-my-6w">
      {title && <PageTitle>{title}</PageTitle>}
      <div className="fr-container--fluid fr-my-6w">
        <HighlightListWrapper className="fr-grid-row fr-grid-row--gutters">
          {data?.map(
            ({
              title,
              body,
              subTitle,
              description,
              icon,
              altIcon,
            }: HighlightType) => (
              <HighlightWrapper key={icon} className="fr-col-sm">
                <Highlight
                  title={title}
                  body={body}
                  subTitle={subTitle}
                  description={description}
                  icon={icon}
                  altIcon={altIcon}
                />
              </HighlightWrapper>
            )
          ) || null}
        </HighlightListWrapper>
      </div>
    </div>
  );
}

export default HighlightList;
