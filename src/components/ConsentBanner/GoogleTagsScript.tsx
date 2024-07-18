import Script from 'next/script';
import React from 'react';
type GoogleTagsScriptProps = React.ComponentProps<typeof Script> & {
  tagIds: string[];
};

const GoogleTagsScript: React.FC<GoogleTagsScriptProps> = ({ tagIds, ...props }) => {
  return (
    <>
      {tagIds.map((tagId) => (
        <Script key={tagId} id={`google-ads-tag-${tagId}`} {...props}>
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${tagId}');

window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  'gtm.start': new Date().getTime(),
  event: 'gtm.js',
  'config': { 'anonymize_ip': true }
});`}
        </Script>
      ))}
    </>
  );
};

export default GoogleTagsScript;
