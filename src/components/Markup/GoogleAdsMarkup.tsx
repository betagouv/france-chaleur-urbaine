interface WindowTrackingExtended extends Window {
  dataLayer: any[];
  gtag: (...args: any[]) => void;
}
declare let window: WindowTrackingExtended;

const GoogleAdsMarkup = ({ googleId }: { googleId: string }) => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          tarteaucitron.user.gtagUa = 'AW-${googleId}';
          // tarteaucitron.user.gtagCrossdomain = ['example.com', 'example2.com'];
          tarteaucitron.user.gtagMore = function () { /* add here your optionnal gtag() */ };
          (tarteaucitron.job = tarteaucitron.job || []).push('gtag');
        `,
      }}
    />
  );
};

export default GoogleAdsMarkup;

export const googleAdsEvent = (googleId: string, [adsId]: string[]) =>
  typeof window?.gtag === 'function' &&
  window.gtag('event', 'conversion', {
    send_to: `AW-${googleId}/${adsId}`,
  });
