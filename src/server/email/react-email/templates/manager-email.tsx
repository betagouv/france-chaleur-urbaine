import * as React from 'react';

import { Layout, type LayoutModifiableProps, Note, Section, Text } from '../components';

type ManagerEmailProps = {
  content: string;
  signature: string;
};

export const ManagerEmail = ({ content, signature, ...props }: ManagerEmailProps & LayoutModifiableProps) => (
  <Layout {...props}>
    <Section>
      <Text dangerouslySetInnerHTML={{ __html: content }} />
      <Text>{signature}</Text>
    </Section>
    <Section>
      <Note>Cet email a été envoyé via la plateforme France Chaleur Urbaine</Note>
    </Section>
  </Layout>
);

export default ManagerEmail;
