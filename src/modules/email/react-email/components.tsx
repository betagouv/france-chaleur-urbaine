import {
  Body as ReactEmailBody,
  Button as ReactEmailButton,
  Column as ReactEmailColumn,
  Container as ReactEmailContainer,
  Head as ReactEmailHead,
  Hr as ReactEmailHr,
  Html as ReactEmailHtml,
  Img as ReactEmailImg,
  Link as ReactEmailLink,
  Markdown as ReactEmailMarkdown,
  Preview as ReactEmailPreview,
  Row as ReactEmailRow,
  Section as ReactEmailSection,
  Text as ReactEmailText,
} from '@react-email/components';
import type React from 'react';

const colors = {
  background: '#f5f5ff',
  border: '#f0f0f0',
  dark: '#333333',
  primary: '#000091', // can't import from components/ui/helpers/colors because it gives a css class
};

export const Button = ({ style, ...props }: React.ComponentProps<typeof ReactEmailButton>) => (
  <ReactEmailButton
    style={{
      backgroundColor: colors.primary,
      color: 'white',
      cursor: 'pointer',
      fontSize: '16px',
      padding: '8px 16px',
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
      boxShadow: '0 2px 7px 0 rgb(0 0 0 / 21%)',
      margin: 'auto',
      maxWidth: '800px',
      padding: '16px 32px',
      ...style,
    }}
    {...props}
  />
);

export const Section = ({ style, ...props }: React.ComponentProps<typeof ReactEmailSection>) => (
  <ReactEmailSection
    style={{
      boxSizing: 'border-box',
      overflowWrap: 'break-word',
      padding: '16px 0',
      ...style,
    }}
    {...props}
  />
);

export const Text = ({ style, ...props }: React.ComponentProps<typeof ReactEmailText>) => (
  <ReactEmailText
    style={{
      fontSize: '16px',
      lineHeight: '1.5',
      marginBottom: '16px',
      padding: 0,
      ...style,
    }}
    {...props}
  />
);

export const Url = ({ style, ...props }: React.ComponentProps<typeof Text>) => (
  <Text
    style={{
      color: colors.dark,
      fontStyle: 'italic',
      overflowWrap: 'anywhere',
      wordBreak: 'break-all',
      ...style,
    }}
    {...props}
  />
);

export const Note = ({ style, ...props }: React.ComponentProps<typeof ReactEmailText>) => (
  <ReactEmailText
    style={{
      color: '#666',
      fontSize: '12px',
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
    src="http://localhost:3000/logo-rf.svg"
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

export const Row = ({ children, style }: React.ComponentProps<typeof ReactEmailRow>) => (
  <ReactEmailRow
    style={{
      backgroundColor: 'white',
      padding: '16px 0',
      ...style,
    }}
  >
    {children}
  </ReactEmailRow>
);

export const Column = ({ children, style }: React.ComponentProps<typeof ReactEmailColumn>) => (
  <ReactEmailColumn
    style={{
      backgroundColor: 'white',
      padding: '16px 0',
      ...style,
    }}
  >
    {children}
  </ReactEmailColumn>
);

export const Hr = ReactEmailHr;

export const Table = ({ children, style }: React.TableHTMLAttributes<HTMLTableElement>) => (
  <table
    style={{
      backgroundColor: 'white',
      padding: '16px 0',
      ...style,
    }}
  >
    {children}
  </table>
);

export const TableRow = ({ children, style }: React.TableHTMLAttributes<HTMLTableRowElement>) => (
  <tr
    style={{
      backgroundColor: 'white',
      padding: '8px 0',
      ...style,
    }}
  >
    {children}
  </tr>
);

export const TableColumn = ({ children, style }: React.TableHTMLAttributes<HTMLTableCellElement>) => (
  <td
    style={{
      backgroundColor: 'white',
      padding: '8px 0',
      ...style,
    }}
  >
    {children}
  </td>
);

export const Title = ({ children, style }: React.ComponentProps<typeof ReactEmailText>) => (
  <Text style={{ fontSize: '18px', fontWeight: 'bold', ...style }}>{children}</Text>
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
