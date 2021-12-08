import React from 'react';

interface WindowTrackingExtended extends Window {
  _linkedin_data_partner_ids: string[];
  fbq: (param: any) => void;
}
declare let window: WindowTrackingExtended;

const FacebookMarkup = ({ facebookId }: { facebookId: string }) => {
  return (
    <script
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `
          tarteaucitron.user.facebookpixelId = '${facebookId}'; tarteaucitron.user.facebookpixelMore = function () { /* add here your optionnal facebook pixel function */ };
          (tarteaucitron.job = tarteaucitron.job || []).push('facebookpixel');
        `,
      }}
    ></script>
  );
};

export default FacebookMarkup;

export const facebookEvent = (
  facebookEventValues: string[],
  userEventValues: (string | number)[] = []
) =>
  typeof window?.fbq === 'function' &&
  window.fbq(['track', ...facebookEventValues, ...userEventValues]);
