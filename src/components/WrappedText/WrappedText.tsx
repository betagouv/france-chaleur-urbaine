import type React from 'react';
import type { ReactNode } from 'react';

import MarkdownWrapper from '@/components/MarkdownWrapper';

import { Container, ImageContainer, TextContainer } from './WrappedText.style';

const WrappedText: React.FC<{
  children?: ReactNode;
  title?: ReactNode;
  body?: string;
  imgSrc?: string;
  imgAlt?: string;
  textClassName?: string;
  imgClassName?: string;
  reverse?: boolean;
  center?: boolean;
  className?: string;
  markdown?: boolean;
}> = ({ children, title, body, imgSrc, imgAlt = '', textClassName, imgClassName, reverse, center, className, markdown = true }) => {
  return (
    <Container reverse={reverse} center={center} className={className}>
      <TextContainer reverse={reverse} className={`${textClassName}--container`}>
        {title && <h2>{title}</h2>}
        {markdown ? <MarkdownWrapper value={body} className={textClassName} /> : <div className={textClassName}>{body}</div>}
        {children}
      </TextContainer>

      {imgSrc && (
        <ImageContainer className={imgClassName}>
          <img src={imgSrc} alt={imgAlt} />
        </ImageContainer>
      )}
    </Container>
  );
};

export default WrappedText;
