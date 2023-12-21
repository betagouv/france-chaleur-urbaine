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
