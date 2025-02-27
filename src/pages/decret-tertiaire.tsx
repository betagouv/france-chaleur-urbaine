import SimplePage from '@/components/shared/page/SimplePage';
import Tertiaire from '@/components/Tertiaire';

function DecretTertiairePage() {
  return (
    <SimplePage
      title="Décret tertiaire et chauffage urbain: atteignez vos objectifs de performance énergétique"
      description="Jusqu’à 23 % de réduction de consommations d’énergie comptabilisée ! En application de l’arrêté du 13 avril 2022 relatif aux obligations d’actions de réduction des consommations d’énergie finale dans des bâtiments à usage tertiaire."
      currentPage="/professionnels"
    >
      <Tertiaire alt />
    </SimplePage>
  );
}

export default DecretTertiairePage;
