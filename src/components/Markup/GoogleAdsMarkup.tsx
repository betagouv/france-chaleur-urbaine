const GoogleAdsMarkup = ({ googleIds }: { googleIds: string[] }) => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          tarteaucitron.user.multiplegtagUa = ${JSON.stringify(googleIds)};
          (tarteaucitron.job = tarteaucitron.job || []).push('multiplegtag');
        `,
      }}
    />
  );
};

export default GoogleAdsMarkup;
