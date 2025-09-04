import { type HTMLAttributes, useState } from 'react';

const IFrameLink = ({ link, withBacklink = true, ...props }: { link: string; withBacklink?: boolean } & HTMLAttributes<HTMLElement>) => {
  const [copied, setCopied] = useState(false);

  const backlink = `<div style="font-size:11px;color:#999;text-align:right;">Fourni par <a href="https://france-chaleur-urbaine.beta.gouv.fr" target="_blank" rel="noopener">France Chaleur Urbaine</a></div>`;
  const linkWithBacklink = `${link}${withBacklink ? backlink : ''}`;

  const onCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
    void navigator.clipboard.writeText(linkWithBacklink).catch();
  };

  return (
    <div className="relative" {...props}>
      {copied && (
        <div className="inset-0 flex items-center justify-center bg-white/50 absolute">
          <span className="py-1 px-2 rounded-md text-sm text-white bg-blue">Copié</span>
        </div>
      )}
      <div
        onClick={onCopy}
        className="text-left bg-faded-light cursor-pointer font-mono text-xs !border !border-gray-300 rounded-md px-4 py-3 fr-btn--icon-right fr-icon-clipboard-line"
      >
        {linkWithBacklink}
      </div>
    </div>
  );
};

export default IFrameLink;
