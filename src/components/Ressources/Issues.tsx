import Link from 'next/link';
import { issues } from './config';
import { Issue, IssuesCard, IssueTitle } from './Issues.styles';

const Issues = () => {
  return (
    <IssuesCard>
      {Object.entries(issues).map(([key, issue]) => (
        <Issue key={key}>
          <IssueTitle>{issue.title}</IssueTitle>
          {issue.description}
          <br />
          <Link href={`/ressources/${key}`}>Lire l'article</Link>
        </Issue>
      ))}
    </IssuesCard>
  );
};

export default Issues;
