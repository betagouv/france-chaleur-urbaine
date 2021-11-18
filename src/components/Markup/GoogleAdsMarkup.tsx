import React from 'react';

interface WindowTrackingExtended extends Window {
  dataLayer: any[];
  gtag: (...args: any[]) => void;
}
declare let window: WindowTrackingExtended;

const GoogleAdsMarkup = ({ googleId }: { googleId: string }) => {
  return (
    <>
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
    </>
  );
};

export default GoogleAdsMarkup;

export const googleAdsEvent = (googleId: string, [adsId]: string[]) =>
  window?.gtag('event', 'conversion', {
    send_to: `AW-${googleId}/${adsId}`,
  });
