const LinkedInMarkup = ({ tagId }: { tagId: string }) => {
  return (
    <script
      type="text/javascript"
      dangerouslySetInnerHTML={{
        __html: `
          tarteaucitron.user.linkedininsighttag = '${tagId}';
          (tarteaucitron.job = tarteaucitron.job || []).push('linkedininsighttag');
        `,
      }}
    ></script>
  );
};

export default LinkedInMarkup;
