import MarkdownWrapper from '@components/MarkdownWrapper';
import MainLayout from '@components/shared/layout/MainLayout';
import { privacyPolicy } from '@data';
import Head from 'next/head';
import React from 'react';
import styled from 'styled-components';

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

function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Politique de confidentialité : France Chaleur Urbaine</title>
      </Head>
      <MainLayout>
        <div className="fr-container fr-mt-2w">
          <div className="fr-grid-row">
            <div className="fr-col-12">
              <div className="fr-col-12">
                <StyledMarkdown value={privacyPolicy} />
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}

export default PrivacyPolicy;
