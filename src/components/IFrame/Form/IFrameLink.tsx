import { HTMLAttributes, useState } from 'react';

import Box from '@components/ui/Box';

import { CopyInfo, IFrameBox } from './IFrameLink.styles';

const IFrameLink = ({ link, ...props }: { link: string } & HTMLAttributes<HTMLElement>) => {
  const [copied, setCopied] = useState(false);
  const onCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
    navigator.clipboard.writeText(link).catch();
  };

  return (
    <Box position="relative" {...props}>
      {copied && <CopyInfo>Copié</CopyInfo>}
      <IFrameBox onClick={onCopy} className="fr-btn--icon-right fr-icon-clipboard-line">
        {link}
      </IFrameBox>
    </Box>
  );
};

export default IFrameLink;
