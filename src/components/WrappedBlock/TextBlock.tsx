import MarkdownWrapper from '@components/MarkdownWrapper';
import React from 'react';
import { TextContainer } from './WrappedBlock.style';

const TextBlock: React.FC<{
  title?: string;
  body?: string;
  className?: string;
}> = ({ title, body, children, className }) => {
  return (
    <TextContainer className="fr-col-lg-6 fr-col-md-12">
      <h2>{title}</h2>
      {<MarkdownWrapper value={body} className={className} />}
      {children}
    </TextContainer>
  );
};

export default TextBlock;
