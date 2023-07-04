import { CardDescription, CardTitle } from '@dataesr/react-dsfr';
import Link from 'next/link';
import {
  BottomLink,
  CardContainer,
  UnderstandingCard,
  UnderstandingCards,
} from './Understanding.styles';
import { coldNetworks } from './config';

const ColdNetwork = () => {
  return (
    <UnderstandingCards>
      {Object.entries(coldNetworks).map(([key, resource]) => (
        <CardContainer key={key}>
          <UnderstandingCard
            asLink={<Link href={`/ressources/${key}#contenu`} />}
          >
            <CardTitle>{resource.title}</CardTitle>
            <CardDescription>
              {resource.description}
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

export default ColdNetwork;
