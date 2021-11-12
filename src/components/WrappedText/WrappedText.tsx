import MarkdownWrapper from '@components/MarkdownWrapper';
import React from 'react';
import { Container, ImageContainer } from './WrappedText.style';

const WrappedText: React.FC<{
  title?: string;
  body?: string;
  imgSrc?: string;
  imgAlt?: string;
}> = ({ title, body, imgSrc, imgAlt = '', children }) => {
  return (
    <div className="fr-grid-row fr-grid-row--gutters fr-grid-row--center fr-grid-row--middle fr-my-4w">
      <Container className="fr-col-lg-6 fr-col-md-12">
        <h2>{title}</h2>
        {<MarkdownWrapper value={body} />}
        {children}
      </Container>

      {imgSrc && (
        <ImageContainer className="fr-col-lg-6 fr-col-md-12">
          <img src={imgSrc} alt={imgAlt} />
        </ImageContainer>
      )}
    </div>
  );
};

export default WrappedText;
