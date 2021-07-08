import MainLayout from '@components/shared/layout/MainLayout';

function PointOfView() {
  return (
    <MainLayout>
      <a
        className="fr-md-auto"
        href="https://voxusagers.numerique.gouv.fr/Demarches/2245?&view-mode=formulaire-avis&nd_mode=en-ligne-enti%C3%A8rement&nd_source=button&key=1a39cbb175774291669232f93af094b0"
      >
        <img
          src="https://voxusagers.numerique.gouv.fr/static/bouton-bleu.svg"
          alt="Je donne mon avis"
          title="Je donne mon avis sur cette démarche"
        />
      </a>
    </MainLayout>
  );
}

export default PointOfView;
