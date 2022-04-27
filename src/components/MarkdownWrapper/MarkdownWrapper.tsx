import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import rehypeReact from 'rehype-react';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import {
  ButtonLink,
  Cartridge,
  CheckItem,
  CounterItem,
  isExternalLink,
  KnowMoreLink,
  MarkdownWrapperStyled,
  PuceIcon,
} from './MarkdownWrapper.style';

const RoutedLink = (props: any) => {
  const { href } = props;
  const extProps = {
    target: href && isExternalLink(href) ? '_blank' : undefined,
    rel:
      href && isExternalLink(href)
        ? ['nofollow', 'noopener', 'noreferrer'].join(' ')
        : '',
  };
  return (
    <Link href={href} prefetch={false} passHref>
      <a {...props} {...extProps} />
    </Link>
  );
};

const ConsentLink: React.FC<{
  ForceBlock: React.ElementType;
}> = ({ children, ForceBlock = React.Fragment }) => (
  <ForceBlock>
    <a href="#consentement">{children}</a>
  </ForceBlock>
);

const processor = (extender: Record<string, unknown> = {}) =>
  unified()
    .use(remarkParse)
    .use(remarkDirective)
    .use(remarkDirectiveRehype)
    .use(remarkRehype)
    .use(rehypeReact, {
      createElement: React.createElement,
      Fragment: React.Fragment,
      components: {
        a: RoutedLink,
        ...extender,
      },
    });

const MarkdownWrapper: React.FC<{
  value?: string;
  id?: JSX.IntrinsicAttributes;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, value, id, className, ...props }) => {
  const [md, setMd]: [string, (s: string) => void] = useState('');

  useEffect(() => {
    const getContent = async () => {
      const content = value || (typeof children === 'string' && children) || '';
      setMd(String(content));
    };
    getContent();
  }, [children, value]);

  return (
    <MarkdownWrapperStyled
      className={className}
      id={id && String(id)}
      {...props}
    >
      {
        processor({
          'check-item': CheckItem,
          'counter-item': CounterItem,
          'consent-link': ConsentLink,
          cartridge: Cartridge,
          'puce-icon': PuceIcon,
          'button-link': ButtonLink,
          'know-more-link': KnowMoreLink,
        }).processSync(md).result
      }
    </MarkdownWrapperStyled>
  );
};

export default MarkdownWrapper;
