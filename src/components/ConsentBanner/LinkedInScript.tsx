import Script from 'next/script';
import React from 'react';

type LinkedInScriptProps = React.ComponentProps<typeof Script> & {
  partnerId: string;
};

// https://www.linkedin.com/help/lms/answer/a415868
const LinkedInScript: React.FC<LinkedInScriptProps> = ({ partnerId, ...props }) => {
  return (
    <>
      <Script id="linkedin-snippet" {...props}>
        {`_linkedin_partner_id = "${partnerId}";
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(_linkedin_partner_id);
(function(l) {
  if (!l) {
    window.lintrk = function(a, b) {
      window.lintrk.q.push([a, b])
    };
    window.lintrk.q = []
  }
  var s = document.getElementsByTagName("script")[0];
  var b = document.createElement("script");
  b.type = "text/javascript";
  b.async = true;
  b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
  s.parentNode.insertBefore(b, s);
})(window.lintrk);`}
      </Script>
    </>
  );
};

export default LinkedInScript;
