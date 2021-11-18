import React from 'react';

const MatomoMarkup = ({
  matomoUrl,
  siteId,
}: {
  matomoUrl: string;
  siteId: string;
}) => {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
              /* Matomo */
               var _paq = window._paq = window._paq || [];
              _paq.push(['trackPageView']);
              _paq.push(["disableCookies"]);
              _paq.push(['enableLinkTracking']);
              (function() {
                var u="${matomoUrl}";
                _paq.push(['setTrackerUrl', u+'matomo.php']);
                _paq.push(['setSiteId', '${siteId}']);
                var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
                g.type='text/javascript'; g.async=true; g.defer=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
              })();
            `,
        }}
      />
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<p><img src="${matomoUrl}/matomo.php?idsite='${siteId}'&amp;rec=1" style="border:0;" alt="" /></p>`,
        }}
      />
    </>
  );
};

export default MatomoMarkup;
