import { CardDescription, CardTitle } from '@codegouvfr/react-dsfr';
import Link from 'next/link';
import {
  BottomLink,
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
            asLink={<Link href={`/ressources/${key}#contenu`} />}
          >
            <CardTitle>
              {cards && understanding.altTitle
                ? understanding.altTitle
                : understanding.title}
            </CardTitle>
            <CardDescription>
              {understanding.description}
              <br />
              <br />
            </CardDescription>
          </UnderstandingCard>
          <BottomLink>Lire l'article</BottomLink>
        </CardContainer>
      ))}
    </UnderstandingCards>
  );
};

export default Understanding;
