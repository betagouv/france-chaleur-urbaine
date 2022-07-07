interface WindowTrackingExtended extends Window {
  _linkedin_data_partner_ids: string[];
  lintrk: (action: string, param: any) => void;
}
declare let window: WindowTrackingExtended;

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

export const linkedInEvent = ([conversionId]: number[]) =>
  typeof window?.lintrk === 'function' &&
  window.lintrk('track', { conversion_id: conversionId });
