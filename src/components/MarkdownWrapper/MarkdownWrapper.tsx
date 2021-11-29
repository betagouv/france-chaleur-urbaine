import React, { useEffect, useState } from 'react';
import rehypeReact from 'rehype-react';
import remarkDirective from 'remark-directive';
import remarkDirectiveRehype from 'remark-directive-rehype';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import {
  Cartridge,
  CounterItem,
  MarkdownWrapperStyled,
  MyLink,
  PuceIcon,
} from './MarkdownWrapper.style';

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
        a: MyLink,
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
          'counter-item': CounterItem,
          cartridge: Cartridge,
          'puce-icon': PuceIcon,
        }).processSync(md).result
      }
    </MarkdownWrapperStyled>
  );
};

export default MarkdownWrapper;
