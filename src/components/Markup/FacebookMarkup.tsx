import React from 'react';

interface WindowTrackingExtended extends Window {
  _linkedin_data_partner_ids: string[];
  fbq: (param: any) => void;
}
declare let window: WindowTrackingExtended;

const FacebookMarkup = ({ facebookId }: { facebookId: string }) => {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window,document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${facebookId}'); 
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {` 
        <img height="1" width="1" 
        src="https://www.facebook.com/tr?id=${facebookId}&ev=PageView
        &noscript=1"/>
        `}
      </noscript>
    </>
  );
};

export default FacebookMarkup;

export const facebookEvent = (
  facebookEventValues: string[],
  userEventValues: (string | number)[] = []
) => window.fbq(['track', ...facebookEventValues, ...userEventValues]);
