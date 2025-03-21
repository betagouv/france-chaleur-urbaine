import { Body, Button, Container, Head, Html, Img, Preview, Section } from '@react-email/components';
import { type ComponentProps, type CSSProperties, type PropsWithChildren } from 'react';

export const commonEmailsProps = {
  websiteUrl: process.env.NEXT_PUBLIC_MAP_ORIGIN as string,
};

export type CommonEmailProps = typeof commonEmailsProps;

export type EmailProps<G extends object> = CommonEmailProps & G;

type EmailTemplateProps = PropsWithChildren<{
  preview: string;
}>;

export const EmailTemplate = ({ preview, children }: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://raw.githubusercontent.com/betagouv/france-chaleur-urbaine/dev/public/logo-fcu-with-typo.jpg"
          alt="France Chaleur Urbaine"
          style={imgHeader}
        />
        <Section style={section}>{children}</Section>
        <Img
          src="https://upload.wikimedia.org/wikipedia/fr/2/22/Republique-francaise-logo.svg"
          alt="République Française"
          style={imgFooter}
        />
      </Container>
    </Body>
  </Html>
);

const main: CSSProperties = {
  backgroundColor: '#f5f5ff',
  padding: '16px 0',
};

const container: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #f0f0f0',
  padding: '45px',
  margin: 'auto',
  maxWidth: '800px',
  boxShadow: '0 2px 7px 0 rgb(0 0 0 / 21%)',
};

const section: CSSProperties = {
  padding: '16px 0',
  overflowWrap: 'break-word',
};

const imgHeader: CSSProperties = {
  height: '200px',
};

const imgFooter: CSSProperties = {
  height: '150px',
};

export const DSFRButton = (props: ComponentProps<typeof Button>) => (
  <Button
    {...props}
    style={{
      color: '#ffffff',
      backgroundColor: '#000091',
      padding: '8px 16px',
    }}
  />
);
