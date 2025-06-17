import {
  Body as ReactEmailBody,
  Button as ReactEmailButton,
  Container as ReactEmailContainer,
  Head as ReactEmailHead,
  Html as ReactEmailHtml,
  Img as ReactEmailImg,
  Link as ReactEmailLink,
  Markdown as ReactEmailMarkdown,
  Preview as ReactEmailPreview,
  Section as ReactEmailSection,
  Text as ReactEmailText,
} from '@react-email/components';
import React from 'react';

const colors = {
  primary: '#000091', // can't import from components/ui/helpers/colors because it gives a css class
  background: '#f5f5ff',
  border: '#f0f0f0',
  dark: '#333333',
};

export const Button = ({ style, ...props }: React.ComponentProps<typeof ReactEmailButton>) => (
  <ReactEmailButton
    style={{
      padding: '8px 16px',
      backgroundColor: colors.primary,
      color: 'white',
      fontSize: '16px',
      cursor: 'pointer',
      textDecoration: 'none',
      ...style,
    }}
    {...props}
  />
);

export const Container = ({ style, ...props }: React.ComponentProps<typeof ReactEmailContainer>) => (
  <ReactEmailContainer
    style={{
      backgroundColor: '#FFFFFF',
      margin: 'auto',
      padding: '16px 32px',
      maxWidth: '800px',
      boxShadow: '0 2px 7px 0 rgb(0 0 0 / 21%)',
      ...style,
    }}
    {...props}
  />
);

export const Section = ({ style, ...props }: React.ComponentProps<typeof ReactEmailSection>) => (
  <ReactEmailSection
    style={{
      boxSizing: 'border-box',
      padding: '16px 0',
      overflowWrap: 'break-word',
      ...style,
    }}
    {...props}
  />
);

export const Text = ({ style, ...props }: React.ComponentProps<typeof ReactEmailText>) => (
  <ReactEmailText
    style={{
      fontSize: '16px',
      padding: 0,
      marginBottom: '16px',
      lineHeight: '1.5',
      ...style,
    }}
    {...props}
  />
);

export const Url = ({ style, ...props }: React.ComponentProps<typeof Text>) => (
  <Text
    style={{
      wordBreak: 'break-all',
      overflowWrap: 'anywhere',
      color: colors.dark,
      fontStyle: 'italic',
      ...style,
    }}
    {...props}
  />
);

export const Note = ({ style, ...props }: React.ComponentProps<typeof ReactEmailText>) => (
  <ReactEmailText
    style={{
      fontSize: '14px',
      fontStyle: 'italic',
      ...style,
    }}
    {...props}
  />
);

export const Html = ReactEmailHtml;
export const Img = ReactEmailImg;
export const Link = ReactEmailLink;

export const LogoFCU = () => (
  <Img
    style={{
      height: '120px',
    }}
    alt="France Chaleur Urbaine"
    src="https://france-chaleur-urbaine.beta.gouv.fr/logo-fcu-with-typo.jpg"
  />
);

export const LogoRF = ({ style }: React.ComponentProps<typeof ReactEmailImg>) => (
  <Img
    style={{
      height: '80px',
      ...style,
    }}
    alt="République Française"
    src="https://upload.wikimedia.org/wikipedia/fr/2/22/Republique-francaise-logo.svg"
  />
);

export const Body = ({ children, style }: React.ComponentProps<typeof ReactEmailBody>) => (
  <ReactEmailBody
    style={{
      backgroundColor: 'white',
      padding: '16px 0',
      ...style,
    }}
  >
    {children}
  </ReactEmailBody>
);

export const Markdown = ({ children }: React.ComponentProps<typeof ReactEmailMarkdown>) => (
  <ReactEmailMarkdown
    markdownCustomStyles={{
      codeInline: { background: 'grey' },
    }}
    markdownContainerStyles={{}}
  >
    {children}
  </ReactEmailMarkdown>
);

export type LayoutModifiableProps = { preview?: string };

export type LayoutProps = LayoutModifiableProps &
  (
    | {
        children: React.ReactNode;
        variant?: 'default' | 'section' | 'empty';
      }
    | {
        children: string;
        variant: 'markdown';
      }
  );

export const Layout = ({ children, variant = 'default', preview }: LayoutProps) => (
  <ReactEmailHtml>
    <ReactEmailHead />
    {preview && <ReactEmailPreview>{preview}</ReactEmailPreview>}
    <Body>
      <Container>
        {variant === 'markdown' ? (
          <Markdown>{children as string}</Markdown>
        ) : variant === 'section' ? (
          <Section>{children}</Section>
        ) : (
          children
        )}
        {variant !== 'empty' && (
          <table
            style={{
              marginTop: '32px',
            }}
          >
            <tr>
              <td>
                <LogoRF />
              </td>
              <td>
                <LogoFCU />
              </td>
            </tr>
          </table>
        )}
      </Container>
    </Body>
  </ReactEmailHtml>
);
