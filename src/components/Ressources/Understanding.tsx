import { CardDescription, CardTitle } from '@dataesr/react-dsfr';
import Link from 'next/link';
import { understandings } from './config';
import {
  BottomLink,
  UnderstandingCard,
  UnderstandingCards,
} from './Understanding.styles';

const Understanding = () => {
  return (
    <UnderstandingCards>
      {Object.entries(understandings).map(([key, understanding]) => (
        <UnderstandingCard
          key={key}
          asLink={<Link href={`/ressources/${key}`} />}
        >
          <CardTitle>{understanding.title}</CardTitle>
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
