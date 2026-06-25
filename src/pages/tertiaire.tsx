import SimplePage from '@/components/shared/page/SimplePage';
import Tertiaire from '@/components/Tertiaire';
import { useTrackPageView } from '@/modules/conversion-tracking/client/useTrackPageView';

function TertiairePage() {
  useTrackPageView();
  return (
    <SimplePage
      title="Chauffage urbain pour le secteur tertiaire"
      description="Vos locaux sont chauffés au fioul ou au gaz ? Économisez sur les coûts énergétiques en vous raccordant à un réseau de chaleur"
    >
      <Tertiaire />
    </SimplePage>
  );
}

export default TertiairePage;
