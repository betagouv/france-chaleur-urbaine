import React, { useState } from 'react';
import { Container, CopyInfo, IFrameBox } from './IFrameLink.styles';

const IFrameLink = ({ link }: { link: string }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
    navigator.clipboard.writeText(link).catch();
  };

  return (
    <Container>
      {copied && <CopyInfo>Copié</CopyInfo>}
      <IFrameBox
        onClick={onCopy}
        className="fr-btn--icon-right fr-icon-clipboard-line"
      >
        {link}
      </IFrameBox>
    </Container>
  );
};

export default IFrameLink;
