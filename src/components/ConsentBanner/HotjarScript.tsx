import Script from 'next/script';
import type React from 'react';

type HotjarScriptProps = React.ComponentProps<typeof Script> & {
  hjid: string;
  hjsv: string;
};

const HotjarScript: React.FC<HotjarScriptProps> = ({ hjid, hjsv, ...props }) => {
  return (
    <Script id={'hotjar-snippet'} {...props}>
      {`(function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:${hjid},hjsv:${hjsv}};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
`}
    </Script>
  );
};

export default HotjarScript;
