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
