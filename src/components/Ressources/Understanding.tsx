import {
  CardContainer,
  UnderstandingCard,
  UnderstandingCards,
} from './Understanding.styles';
import { Document, understandings } from './config';

const Understanding = ({ cards }: { cards?: Record<string, Document> }) => {
  return (
    <UnderstandingCards>
      {Object.entries(cards || understandings).map(([key, understanding]) => (
        <CardContainer key={key}>
          <UnderstandingCard
            title={
              cards && understanding.altTitle
                ? understanding.altTitle
                : understanding.title
            }
            desc={understanding.description}
            linkProps={{
              href: `/ressources/${key}#contenu`,
            }}
            border
            enlargeLink
            size="small"
            titleAs="h4"
          ></UnderstandingCard>
        </CardContainer>
      ))}
    </UnderstandingCards>
  );
};

export default Understanding;
