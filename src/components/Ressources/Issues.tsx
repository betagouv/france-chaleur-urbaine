import { CardDescription, CardTitle } from '@dataesr/react-dsfr';
import Link from 'next/link';
import { issues } from './config';
import { BottomLink, Issue, IssuesCard } from './Issues.styles';

const Issues = () => {
  return (
    <IssuesCard>
      {Object.entries(issues).map(([key, issue]) => (
        <Issue key={key} asLink={<Link href={`/ressources/${key}`} />}>
          <CardTitle>{issue.title}</CardTitle>
          <CardDescription>
            {issue.description}
            <br />
            <br />
            <BottomLink>Lire l'article</BottomLink>
          </CardDescription>
        </Issue>
      ))}
    </IssuesCard>
  );
};

export default Issues;
