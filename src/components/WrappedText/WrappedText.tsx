import MarkdownWrapper from '@components/MarkdownWrapper';
import React from 'react';
import { Container, ImageContainer, TextContainer } from './WrappedText.style';

const WrappedText: React.FC<{
  title?: string;
  body?: string;
  imgSrc?: string;
  imgAlt?: string;
  textClassName?: string;
  imgClassName?: string;
  reverse?: boolean;
}> = ({
  title,
  body,
  imgSrc,
  imgAlt = '',
  children,
  textClassName,
  imgClassName,
  reverse,
}) => {
  return (
    <Container
      className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-grid-row--middle fr-my-4w"
      reverse={reverse}
    >
      <TextContainer className="fr-col-lg-6 fr-col-md-12">
        <h2>{title}</h2>
        {<MarkdownWrapper value={body} className={textClassName} />}
        {children}
      </TextContainer>

      <ImageContainer className={`fr-col-lg-6 fr-col-md-12 ${imgClassName}`}>
        {imgSrc && <img src={imgSrc} alt={imgAlt} />}
      </ImageContainer>
    </Container>
  );
};

export default WrappedText;
