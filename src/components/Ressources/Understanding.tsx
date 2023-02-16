import { CardDescription, CardTitle } from '@dataesr/react-dsfr';
import Link from 'next/link';
import { growths, issues, understandings } from './config';
import {
  BottomLink,
  UnderstandingCard,
  UnderstandingCards,
} from './Understanding.styles';

const tertiaireCards = {
  'energies-verte': issues['energies-verte'],
  aides: understandings.aides,
  avantages: understandings.avantages,
  acteurs: growths.acteurs,
};

const Understanding = ({ tertiaire }: { tertiaire?: boolean }) => {
  return (
    <UnderstandingCards>
      {Object.entries(tertiaire ? tertiaireCards : understandings).map(
        ([key, understanding]) => (
          <UnderstandingCard
            key={key}
            asLink={<Link href={`/ressources/${key}`} />}
          >
            <CardTitle>
              {tertiaire && understanding.altTitle
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
        )
      )}
    </UnderstandingCards>
  );
};

export default Understanding;
