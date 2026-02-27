import SimplePage from '@/components/shared/page/SimplePage';

function ChaleurRenouvelableMethodologiePage() {
  return (
    <SimplePage
      title="Découvrez le chauffage qui vous convient !"
      currentPage="/chaleur-renouvelable"
      description="Découvrez les modes de chauffage renouvelables adaptés à votre logement"
    >
      <div
        className="fr-p-5w w-full"
        style={{
          background: 'url("/img/banner_chauffage_gaz.png") no-repeat left center #C3E4E2',
        }}
      >
        <div className="fr-container">
          <h2 className="text-2xl">Méthodologie</h2>
        </div>
      </div>
    </SimplePage>
  );
}

export default ChaleurRenouvelableMethodologiePage;
