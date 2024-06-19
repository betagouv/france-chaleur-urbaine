const GoogleAdsMarkup = ({ googleIds }: { googleIds: string[] }) => {
  console.log('NEXT_PUBLIC_GOOGLE_TAG_ID', googleIds);
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
