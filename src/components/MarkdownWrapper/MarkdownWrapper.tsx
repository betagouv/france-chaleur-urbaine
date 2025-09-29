import { Highlight } from '@codegouvfr/react-dsfr/Highlight';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import rehypeRaw from 'rehype-raw';
import rehypeReact from 'rehype-react';
import remarkBreaks from 'remark-breaks';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

/**
 * MarkdownWrapper - A React component that processes markdown with custom directives
 *
 * Processing pipeline:
 * 1. Markdown text → remark-parse → Markdown AST
 * 2. Markdown AST → remark-rehype → HTML AST
 * 3. HTML AST → rehype-react → React elements
 *
 * Ecosystems:
 * - remark: Processes markdown (mdast - markdown abstract syntax tree)
 * - rehype: Processes HTML (hast - hypertext abstract syntax tree)
 * - unified: Connects both ecosystems through plugins
 *
 * Custom directives supported:
 * - ::check-item, ::arrow-item, ::thumb-item - Custom list items
 * - ::highlight - DSFR highlight component
 * - ::cartridge - Custom cartridge component
 * - ::button-link, ::extra-link - Custom link components
 */

import {
  ArrowItem,
  ButtonLink,
  Cartridge,
  CheckItem,
  CounterItem,
  CountItem,
  ExtraLink,
  isExternalLink,
  KnowMoreLink,
  MarkdownWrapperStyled,
  PuceIcon,
  SmallText,
  ThumbItem,
  WhiteArrowItem,
  WhiteCheckItem,
} from './MarkdownWrapper.style';

export const RoutedLink = (props: any) => {
  const { href, target } = props;
  const extProps = {
    target: target || (href && isExternalLink(href) ? '_blank' : undefined),
    rel: href && isExternalLink(href) ? ['nofollow', 'noopener', 'noreferrer'].join(' ') : '',
  };
  return <Link {...props} {...extProps} />;
};

const ConsentLink: React.FC<{
  children?: React.ReactNode;
  ForceBlock: React.ElementType;
}> = ({ children, ForceBlock = React.Fragment }) => (
  <>
    <ForceBlock>
      <a href="#consentement">{children}</a>
    </ForceBlock>
  </>
);

const processor = (extender: Record<string, unknown> = {}) =>
  unified()
    // 1. Parses markdown text to AST
    .use(remarkParse)
    // 2-4. All markdown AST transformations MUST happen before remarkRehype (step 5)
    // 2. Converts line breaks to <br> tags (modifies markdown AST)
    .use(remarkBreaks)
    // 3. Enables custom directives (::highlight, ::cartridge, etc.)
    .use(remarkDirective)
    // 4. Converts directive nodes to HTML elements for remark-rehype
    .use(remarkDirectiveRehype)
    // 5. Converts markdown AST to HTML AST (after this, no more markdown transformations possible)
    .use(remarkRehype, { allowDangerousHtml: true })
    // 6. Allows raw HTML in markdown (works on HTML AST)
    .use(rehypeRaw)
    // 7. Converts HTML AST to React elements
    .use(rehypeReact, {
      jsx: jsxRuntime.jsx,
      jsxs: jsxRuntime.jsxs,
      Fragment: jsxRuntime.Fragment,
      components: {
        a: RoutedLink,
        ...extender,
      },
    });

const MarkdownWrapper: React.FC<{
  children?: React.ReactNode;
  value?: string | React.ReactNode;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  withPadding?: boolean;
  color?: string;
}> = ({ children, value, id, className, ...props }) => {
  const [md, setMd]: [string, (s: string) => void] = useState('');

  useEffect(() => {
    const getContent = async () => {
      const content = value || (typeof children === 'string' && children) || '';
      setMd(String(content));
    };
    void getContent();
  }, [children, value]);

  return typeof value === 'object' ? (
    value
  ) : (
    <MarkdownWrapperStyled className={className} id={id && String(id)} {...props}>
      {
        processor({
          'check-item': CheckItem,
          'count-item': CountItem,
          'arrow-item': ArrowItem,
          'white-arrow-item': WhiteArrowItem,
          'counter-item': CounterItem,
          'thumb-item': ThumbItem,
          'white-check-item': WhiteCheckItem,
          'consent-link': ConsentLink,
          cartridge: Cartridge,
          'puce-icon': PuceIcon,
          highlight: Highlight,
          'button-link': ButtonLink,
          'extra-link': ExtraLink,
          'know-more-link': KnowMoreLink,
          'strong-inherit': (props: any) => <strong style={{ fontSize: 'inherit' }} {...props} />,
          small: SmallText,
        }).processSync(md).result as React.ReactNode
      }
    </MarkdownWrapperStyled>
  );
};

export default MarkdownWrapper;
