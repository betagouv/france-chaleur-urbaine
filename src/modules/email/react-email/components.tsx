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

import { clientConfig } from '@/client-config';

const colors = {
  background: '#f5f5ff',
  border: '#e3e3fd',
  dark: '#333333',
  primary: '#000091',
};

type ButtonProps = React.ComponentProps<typeof ReactEmailButton> & {
  campaign?: string;
  content?: string;
};
export const Button = ({ href, campaign, content, style, ...props }: ButtonProps) => {
  const trackedHref = resolveEmailHref(href, campaign, content);
  return (
    <ReactEmailButton
      href={trackedHref}
      style={{
        backgroundColor: colors.primary,
        borderRadius: 0,
        color: 'white',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        padding: '8px 16px',
        textDecoration: 'none',
        ...style,
      }}
      {...props}
    />
  );
};

export const Container = ({ style, ...props }: React.ComponentProps<typeof ReactEmailContainer>) => (
  <ReactEmailContainer
    style={{
      backgroundColor: '#FFFFFF',
      borderTop: `4px solid ${colors.primary}`,
      fontFamily: 'Marianne, Arial, sans-serif',
      margin: 'auto',
      maxWidth: '800px',
      padding: '0 32px 24px',
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

export const Callout = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <ReactEmailSection
    style={{
      backgroundColor: '#eef0fb',
      borderLeft: `3px solid ${colors.primary}`,
      padding: '12px 16px',
      ...style,
    }}
  >
    <ReactEmailText style={{ color: colors.dark, fontSize: '14px', lineHeight: '1.5', margin: 0 }}>{children}</ReactEmailText>
  </ReactEmailSection>
);

export const Html = ReactEmailHtml;
export const Img = ReactEmailImg;
type LinkProps = React.ComponentProps<typeof ReactEmailLink> & {
  campaign?: string;
  content?: string;
};
export const Link = ({ href, campaign, content, ...rest }: LinkProps) => {
  const trackedHref = resolveEmailHref(href, campaign, content);
  return <ReactEmailLink href={trackedHref} {...rest} />;
};

export const LogoFCU = ({ style }: { style?: React.CSSProperties }) => (
  <Img
    style={{
      height: '100px',
      ...style,
    }}
    alt="France Chaleur Urbaine"
    src={`${clientConfig.websiteUrl}/logo-fcu-with-typo.jpg`}
  />
);

export const LogoRF = ({ style }: React.ComponentProps<typeof ReactEmailImg>) => (
  <Img
    style={{
      height: '64px',
      ...style,
    }}
    alt="République Française"
    src={`${clientConfig.websiteUrl}/logo-rf.svg`}
  />
);

export const LogoADEME = ({ style }: { style?: React.CSSProperties }) => (
  <Img
    style={{
      height: '80px',
      ...style,
    }}
    alt="ADEME"
    src={`${clientConfig.websiteUrl}/logo-ADEME.svg`}
  />
);

export const Body = ({ children, style }: React.ComponentProps<typeof ReactEmailBody>) => (
  <ReactEmailBody
    style={{
      backgroundColor: colors.background,
      fontFamily: 'Marianne, Arial, sans-serif',
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
      padding: '8px 0',
      width: '100%',
      ...style,
    }}
  >
    {children}
  </table>
);

export const TableRow = ({ children, style }: React.TableHTMLAttributes<HTMLTableRowElement>) => (
  <tr
    style={{
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
      padding: '6px 12px 6px 0',
      verticalAlign: 'top',
      ...style,
    }}
  >
    {children}
  </td>
);

export const Title = ({ children, style }: React.ComponentProps<typeof ReactEmailText>) => (
  <Text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px', ...style }}>{children}</Text>
);

type LayoutModifiableProps = { preview?: string };

type LayoutProps = LayoutModifiableProps &
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
        {variant !== 'empty' && (
          <>
            <ReactEmailSection style={{ padding: '20px 0 12px' }}>
              <LogoRF style={{ display: 'inline-block', marginRight: '24px', verticalAlign: 'middle' }} />
              <LogoADEME style={{ display: 'inline-block', marginRight: '24px', verticalAlign: 'middle' }} />
              <LogoFCU style={{ display: 'inline-block', verticalAlign: 'middle' }} />
            </ReactEmailSection>
            <ReactEmailHr style={{ borderColor: colors.border, margin: '0 0 24px' }} />
          </>
        )}
        {variant === 'markdown' ? (
          <Markdown>{children as string}</Markdown>
        ) : variant === 'section' ? (
          <Section>{children}</Section>
        ) : (
          children
        )}
        {variant !== 'empty' && (
          <>
            <ReactEmailHr style={{ borderColor: colors.border, margin: '32px 0 16px' }} />
            <ReactEmailRow>
              <ReactEmailColumn>
                <ReactEmailText style={{ color: '#666', fontSize: '12px', lineHeight: '1.5', margin: 0 }}>
                  France Chaleur Urbaine — Service porté par l'ADEME
                </ReactEmailText>
                <ReactEmailText style={{ color: '#999', fontSize: '11px', lineHeight: '1.5', margin: '4px 0 0' }}>
                  Ce message a été envoyé automatiquement. Pour toute question, utilisez le{' '}
                  <Link
                    href="/contact"
                    campaign="email.footer"
                    content="contact"
                    style={{ color: colors.primary, textDecoration: 'underline' }}
                  >
                    formulaire de contact
                  </Link>
                  .
                </ReactEmailText>
              </ReactEmailColumn>
              <ReactEmailColumn style={{ textAlign: 'right', verticalAlign: 'middle', width: '32px' }}>
                <Link href={clientConfig.linkedInUrl} campaign="email.footer" content="linkedin">
                  <Img src={`${clientConfig.websiteUrl}/icons/icon-linkedin.png`} width={20} height={20} alt="LinkedIn" />
                </Link>
              </ReactEmailColumn>
            </ReactEmailRow>
          </>
        )}
      </Container>
    </Body>
  </ReactEmailHtml>
);

/** Appends UTM tracking parameters to an absolute URL for email analytics. */
function withUtmEmail(url: string, campaign: string, content?: string): string {
  const u = new URL(url);
  u.searchParams.set('utm_source', 'fcu');
  u.searchParams.set('utm_medium', 'transactional-email');
  u.searchParams.set('utm_campaign', campaign);
  if (content) {
    u.searchParams.set('utm_content', content);
  }
  return u.toString();
}

/**
 * Resolves an href for use in email components.
 * - Relative paths (starting with `/`) are prefixed with the site base URL.
 * - If a `campaign` is provided, UTM tracking params are appended (FCU links only — skips external URLs).
 */
function resolveEmailHref(href: string | undefined, campaign?: string, content?: string) {
  if (typeof href !== 'string') return href;
  const absolute = href.startsWith('/') ? `${clientConfig.websiteUrl}${href}` : href;
  return campaign && /^https?:\/\//.test(absolute) ? withUtmEmail(absolute, campaign, content) : absolute;
}
