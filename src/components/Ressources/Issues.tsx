import { CardDescription, CardTitle, Icon } from '@dataesr/react-dsfr';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { issues } from './config';
import { Arrow, Container, Issue, IssuesCard } from './Issues.styles';

const issuesData = Object.entries(issues).concat(
  Object.entries(issues).map(([key, document]) => [`${key}-2`, document])
);

const Issues = () => {
  const [firstCard, setFirstCard] = useState(0);

  const setNextCard = useCallback(
    (value: number) => {
      setFirstCard((firstCard + value + issuesData.length) % issuesData.length);
    },
    [firstCard]
  );
  return (
    <Container>
      <Arrow onClick={() => setNextCard(-1)}>
        <Icon name="ri-arrow-left-line" size="2x" />
      </Arrow>
      <IssuesCard>
        {issuesData.map(([key, issue], index) => (
          <Issue
            key={key}
            hide={index < firstCard}
            asLink={<Link href={`/ressources/${key}`} />}
          >
            <CardTitle>{issue.title}</CardTitle>
            <CardDescription>{issue.description}</CardDescription>
          </Issue>
        ))}
      </IssuesCard>
      <Arrow onClick={() => setNextCard(1)}>
        <Icon name="ri-arrow-right-line" size="2x" />
      </Arrow>
    </Container>
  );
};

export default Issues;
