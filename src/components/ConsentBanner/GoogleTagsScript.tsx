import Script from 'next/script';
import React from 'react';
type GoogleTagsScriptProps = React.ComponentProps<typeof Script> & {
  tagIds: string[];
};

const GoogleTagsScript: React.FC<GoogleTagsScriptProps> = ({ tagIds, ...props }) => {
  return (
    <>
      <Script id={`google-ads-tags`}>
        {`
        "use strict";
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() {
          window.dataLayer.push(arguments);
        };
        `}
      </Script>
      {tagIds.map((tagId) => (
        <Script key={tagId} id={`google-ads-tag-${tagId}`} {...props}>
          {`
          (() => {
            const script = document.createElement('script');
            script.src = 'https://www.googletagmanager.com/gtag/js?id=${tagId}';
            script.async = true;
            document.head.appendChild(script);

            script.onload = () => {
              gtag('js', new Date());
              gtag('config', '${tagId}', {
                'anonymize_ip': true
              });
            };
          })()
          `}
        </Script>
      ))}
    </>
  );
};

export default GoogleTagsScript;
