import MarkdownWrapper from '@components/MarkdownWrapper';
import React from 'react';
import { TextContainer } from './WrappedBlock.style';

const TextBlock: React.FC<{
  children?: React.ReactNode;
  title?: string;
  body?: string;
  className?: string;
  bodyClassName?: string;
}> = ({ children, title, body, className, bodyClassName }) => {
  return (
    // TODO: Remove DSFR class system
    <TextContainer className={`fr-col-lg-6 fr-col-md-12 ${className}`}>
      <h2>{title}</h2>
      {body && <MarkdownWrapper value={body} className={bodyClassName} />}
      {children}
    </TextContainer>
  );
};

export default TextBlock;
