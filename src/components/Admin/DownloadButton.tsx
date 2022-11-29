import { Icon } from '@dataesr/react-dsfr';
import { useServices } from 'src/services';

const DownloadButton = ({ id }: { id: string }) => {
  const { heatNetworkService } = useServices();
  const download = () => {
    heatNetworkService.bulkEligibilityExport(id).then(async (data) => {
      const a = document.createElement('a');
      a.download = `eligibility_${id}.xlsx`;

      const byteCharacters = window.atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      a.href = URL.createObjectURL(new Blob([byteArray]));
      a.addEventListener('click', () => {
        setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
      });
      a.click();
    });
  };

  return (
    <button onClick={() => download()}>
      <Icon name="ri-file-download-line" size="2x" />
    </button>
  );
};

export default DownloadButton;
