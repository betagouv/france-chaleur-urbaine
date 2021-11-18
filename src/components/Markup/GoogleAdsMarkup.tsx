import React from 'react';

const googlaAdsIds = [
  'xmLwCPqp5P0CEMrY_5oo',
  '4BLdCLqy_oIDEMrY_5oo',
  '7ZZ6CJL-9YIDEMrY_5oo',
];

const GoogleAdsMarkup = ({ googleId }: { googleId: string }) => {
  return (
    <>
      {/* <!-- Global site tag (gtag.js) - Google Ads --> */}
      <script
        async
        {...{
          src: `https://www.googletagmanager.com/gtag/js?id=AW-${googleId}`,
        }}
      ></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);} gtag('js', new Date());
            gtag('config', 'AW-${googleId}');`,
        }}
      />

      {/* <!-- Event snippet for Formulaire - eligible conversion page --> */}
      <script
        dangerouslySetInnerHTML={{
          __html: googlaAdsIds
            .map(
              (adsId) =>
                `gtag('event', 'conversion', {'send_to': 'AW-${googleId}/${adsId}'});`
            )
            .join(' '),
        }}
      />
    </>
  );
};

export default GoogleAdsMarkup;
