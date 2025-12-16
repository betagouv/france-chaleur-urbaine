import type { HTMLAttributes } from 'react';

import ButtonCopy from '@/components/ui/ButtonCopy';

const IFrameLink = ({
  link,
  withBacklink = true,
  className,
  ...props
}: { link: string; withBacklink?: boolean } & HTMLAttributes<HTMLElement>) => {
  const backlink = `<div style="font-size:11px;color:#999;text-align:right;">Fourni par <a href="https://france-chaleur-urbaine.beta.gouv.fr" target="_blank" rel="noopener">France Chaleur Urbaine</a></div>`;
  const linkWithBacklink = `${link}${withBacklink ? backlink : ''}`;

  return (
    <ButtonCopy text={linkWithBacklink} showOverlay className={className}>
      <div
        className="text-left bg-faded-light cursor-pointer font-mono text-xs border! border-gray-300! rounded-md px-4 py-3 fr-btn--icon-right fr-icon-clipboard-line"
        {...props}
      >
        {linkWithBacklink}
      </div>
    </ButtonCopy>
  );
};

export default IFrameLink;
