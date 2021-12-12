import React from 'react';

interface WindowTrackingExtended extends Window {
  _linkedin_data_partner_ids: string[];
  _paq: [any];
  tarteaucitron: any;
}
declare let window: WindowTrackingExtended;

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

      <script
        type="text/javascript"
        dangerouslySetInnerHTML={{
          __html: `
            tarteaucitron.user.matomoId = ${siteId};
            (tarteaucitron.job = tarteaucitron.job || []).push('matomo');
          `,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            tarteaucitron.user.matomoHost = '${matomoUrl}';
          `,
        }}
      ></script>
    </>
  );
};

export default MatomoMarkup;

const getTarteaucitronjsMatomoConsent = () =>
  window?.tarteaucitron?.proTemp
    ?.split('!')
    ?.reduce((acc: Record<string, unknown>, entry: string) => {
      const [key, value]: string[] = entry.split('=');
      return { ...acc, [key]: value !== 'false' };
    }, {})?.['matomo'];

export const matomoEvent = (
  matomoEventValues: string[],
  userEventValues: (string | number)[] = []
) =>
  typeof window?._paq?.push === 'function' &&
  window._paq.push([
    'trackEvent',
    ...matomoEventValues,
    ...(getTarteaucitronjsMatomoConsent()
      ? userEventValues
      : ['Consentement non accordé']),
  ]);
