import SimplePage from '@/components/shared/page/SimplePage';
import Button from '@/components/ui/Button';
import { MethodologyContent } from '@/modules/chaleur-renouvelable/client/MethodologyContent';

function ChaleurRenouvelableMethodologiePage() {
  return (
    <SimplePage
      title="Simulateur de chauffage écologique et économique : comment ça marche ?"
      currentPage="/chaleur-renouvelable/methodologie"
      description="Simulateur de chauffage écologique et économique : comment ça marche ?"
      layout="center"
      className="fr-my-5w"
    >
      <h1>Simulateur de chauffage écologique et économique : comment ça marche ?</h1>
      <div className="flex justify-center fr-mb-4w">
        <Button priority="primary" href="/chaleur-renouvelable">
          Accéder au simulateur
        </Button>
      </div>
      <MethodologyContent />
      <Button priority="secondary" onClick={() => history.back()}>
        <span className="fr-icon-arrow-left-line fr-mr-1w" /> Retour
      </Button>
    </SimplePage>
  );
}

export default ChaleurRenouvelableMethodologiePage;
