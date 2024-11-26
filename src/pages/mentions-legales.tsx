import styled from 'styled-components';

import MarkdownWrapper from '@components/MarkdownWrapper';
import SimplePage from '@components/shared/page/SimplePage';
import { termOfUse } from '@data';

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

function LegalMentions() {
  return (
    <SimplePage
      title="Mentions légales"
      description="France Chaleur Urbaine est un service numérique de l’administration qui vise à faciliter et multiplier les raccordements aux réseaux de chaleur"
    >
      <div className="fr-container fr-mt-2w">
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <div className="fr-col-12">
              <StyledMarkdown value={termOfUse} />
            </div>
          </div>
        </div>
      </div>
    </SimplePage>
  );
}

export default LegalMentions;
