import SimplePage from '@components/shared/page/SimplePage';
import Tertiaire from '@components/Tertiaire';

export default function DecretTertiairePage() {
  return (
    <SimplePage
      title="Décret tertiaire : atteignez vos objectifs de perfomance énergétique en raccordant votre bâtiment au chauffage urbain"
      currentPage="/professionnels"
    >
      <Tertiaire alt />
    </SimplePage>
  );
}
