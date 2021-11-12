import React, { useEffect, useState } from 'react';
import rehypeReact from 'rehype-react';
import rehypeSanitize from 'rehype-sanitize';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';
import { MarkdownWrapperStyled, MyLink } from './MarkdownWrapper.style';

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeReact, {
    createElement: React.createElement,
    Fragment: React.Fragment,
    components: {
      a: MyLink,
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
      {processor.processSync(md).result}
    </MarkdownWrapperStyled>
  );
};

export default MarkdownWrapper;
