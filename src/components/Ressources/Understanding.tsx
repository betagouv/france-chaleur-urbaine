import { CardDescription, CardTitle } from '@dataesr/react-dsfr';
import Link from 'next/link';
import { Document, understandings } from './config';
import {
  BottomLink,
  UnderstandingCard,
  UnderstandingCards,
} from './Understanding.styles';

const Understanding = ({ cards }: { cards?: Record<string, Document> }) => {
  return (
    <UnderstandingCards>
      {Object.entries(cards || understandings).map(([key, understanding]) => (
        <UnderstandingCard
          key={key}
          asLink={<Link href={`/ressources/${key}`} />}
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
            <BottomLink>Lire l'article</BottomLink>
          </CardDescription>
        </UnderstandingCard>
      ))}
    </UnderstandingCards>
  );
};

export default Understanding;
