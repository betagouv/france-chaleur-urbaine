import SimplePage from '@components/shared/page/SimplePage';
import Tertiaire from '@components/Tertiaire';

export default function TertiairePage() {
  return (
    <SimplePage
      title="Chauffage urbain pour le secteur tertiaire"
      description="Vos locaux sont chauffés au fioul ou au gaz ? Économisez sur les coûts énergétiques en vous raccordant à un réseau de chaleur"
    >
      <Tertiaire />
    </SimplePage>
  );
}
