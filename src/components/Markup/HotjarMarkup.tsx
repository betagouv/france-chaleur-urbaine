const HotjarMarkup = ({
  hotjarId,
  hotjarSv,
}: {
  hotjarId: string;
  hotjarSv: string;
}) => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
        tarteaucitron.user.hotjarId = ${hotjarId};
        tarteaucitron.user.HotjarSv = ${hotjarSv};
        (tarteaucitron.job = tarteaucitron.job || []).push('hotjar');
      `,
      }}
    />
  );
};

export default HotjarMarkup;
