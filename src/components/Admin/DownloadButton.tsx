import Icon from '@components/ui/Icon';
import { useServices } from 'src/services';

const DownloadButton = ({ id, inError }: { id: string; inError: boolean }) => {
  const { heatNetworkService } = useServices();
  const download = () => {
    heatNetworkService.bulkEligibilityExport(id).then(async (data) => {
      const a = document.createElement('a');
      if (!inError) {
        a.download = `eligibility_${id}.xlsx`;

        const byteCharacters = window.atob(data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        a.href = URL.createObjectURL(new Blob([byteArray]));
      } else {
        a.download = `file_${id}.txt`;
        a.href = URL.createObjectURL(new Blob([data]));
      }

      a.addEventListener('click', () => {
        setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
      });
      a.click();
    });
  };

  return (
    <button onClick={() => download()}>
      <Icon name="ri-file-download-line" size="lg" />
    </button>
  );
};

export default DownloadButton;
