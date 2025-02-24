import NetworksList from '@/components/NetworksList/NetworksList';
import SimplePage from '@/components/shared/page/SimplePage';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';

function ListeReseaux() {
  return (
    <SimplePage
      title="Liste des réseaux de chaleur"
      description="Filtrez les réseaux de chaleur selon les critères de votre choix, comparez leurs caractéristiques, accédez aux données détaillées des réseaux."
    >
      <Hero variant="ressource" imageType="inline" image="/img/ressources_header.webp" imageClassName="py-5" imagePosition="right">
        <HeroTitle>Liste des réseaux de chaleur</HeroTitle>
        <HeroSubtitle>Retrouvez l'ensemble des réseaux et filtrez-les selon les critères de votre choix</HeroSubtitle>
      </Hero>

      <NetworksList />
    </SimplePage>
  );
}

export default ListeReseaux;
