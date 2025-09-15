import styled from 'styled-components';

import MarkdownWrapper from '@/components/MarkdownWrapper';
import SimplePage from '@/components/shared/page/SimplePage';
import termOfUse from '@/data/fcu-term-of-use';

const StyledMarkdown = styled(MarkdownWrapper)`
  margin-bottom: 2em;

  p {
    font-size: 1rem;
    line-height: 1.5em;
    margin-bottom: 0.75em;
  }

  em {
    color: inherit;
    font-style: italic;
  }
  strong {
    color: inherit;
  }
  strong em {
    text-decoration: underline;
    color: inherit;
  }

  h2:not(:first-child) {
    margin-top: 1em;
  }

  h2,
  h3 {
    color: rgb(56, 56, 56);
  }

  ul {
    font-size: 1rem;
    line-height: 1.5em;
  }
`;

function CGUPage() {
  return (
    <SimplePage
      title="Conditions générales d'utilisation"
      description="France Chaleur Urbaine est un service du Ministère de la transition écologique qui vise à faciliter et multiplier les raccordements aux réseaux de chaleur."
      layout="center"
    >
      <StyledMarkdown value={termOfUse} />
    </SimplePage>
  );
}

export default CGUPage;
