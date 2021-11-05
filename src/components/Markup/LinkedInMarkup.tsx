import React from 'react';

interface WindowTrackingExtended extends Window {
  _linkedin_data_partner_ids: string[];
  lintrk: (action: string, param: any) => void;
}
declare let window: WindowTrackingExtended;

const LinkedInMarkup = ({ tagId }: { tagId: string }) => {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `_linkedin_partner_id="${tagId}";
            window._linkedin_data_partner_ids=window._linkedin_data_partner_ids || [];
            window._linkedin_data_partner_ids.push(_linkedin_partner_id);`,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function (l) {
              if (!l) {
                window.lintrk = function (a, b) {
                  window.lintrk.q.push([a, b]);
                };
                window.lintrk.q = [];
              }
              const s = document.getElementsByTagName('script')[0];
              const b = document.createElement('script');
              b.type = 'text/javascript';
              b.async = true;
              b.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
              s.parentNode.insertBefore(b, s);
            })(window.lintrk);`,
        }}
      />
      <noscript>
        {`<img
            height="1"
            width="1"
            style="display:none;"
            alt=""
            src="https://px.ads.linkedin.com/collect/?pid=${tagId}&fmt=gif"
          />`}
      </noscript>
    </>
  );
};

export default LinkedInMarkup;

export const linkedInTrack = (...[conversionId]: number[]) =>
  window?.lintrk('track', { conversion_id: conversionId });
