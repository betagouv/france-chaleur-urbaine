import { Highlight } from '@codegouvfr/react-dsfr/Highlight';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import rehypeRaw from 'rehype-raw';
import rehypeReact from 'rehype-react';
import remarkBreaks from 'remark-breaks';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

import {
  ArrowItem,
  ButtonLink,
  Cartridge,
  CheckItem,
  CountItem,
  CounterItem,
  ExtraLink,
  KnowMoreLink,
  MarkdownWrapperStyled,
  PuceIcon,
  SmallText,
  ThumbItem,
  WhiteArrowItem,
  WhiteCheckItem,
  isExternalLink,
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
    .use(remarkBreaks)
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkDirectiveRehype)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeReact, {
      createElement: React.createElement,
      Fragment: React.Fragment,
      components: {
        a: RoutedLink,
        ...extender,
      },
    });

const MarkdownWrapper: React.FC<{
  children?: React.ReactNode;
  value?: string | React.ReactNode;
  id?: JSX.IntrinsicAttributes;
  className?: string;
  style?: React.CSSProperties;
  withPadding?: boolean;
}> = ({ children, value, id, className, ...props }) => {
  const [md, setMd]: [string, (s: string) => void] = useState('');

  useEffect(() => {
    const getContent = async () => {
      const content = value || (typeof children === 'string' && children) || '';
      setMd(String(content));
    };
    getContent();
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
          small: SmallText,
        }).processSync(md).result
      }
    </MarkdownWrapperStyled>
  );
};

export default MarkdownWrapper;
