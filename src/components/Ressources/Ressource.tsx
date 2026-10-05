import { useRouter } from 'next/router';
import { useEffect } from 'react';

import StickyForm from '@/components/StickyForm/StickyForm';
import Box from '@/components/ui/Box';
import Hero, { HeroSubtitle, HeroTitle } from '@/components/ui/Hero';

import { articleCategories, articlesBySlug, getRessource } from './config';
import Guide from './Guide';
import { SideMenu, StickyWrapper } from './Ressource.styles';
import RessourceContent from './RessourceContent';

type RessourceProps = {
  ressourceKey: string;
};

/**
 * Displays a resource article with the shared article categories in the side menu.
 */
const Ressource = ({ ressourceKey }: RessourceProps) => {
  const router = useRouter();
  const content = getRessource(ressourceKey);
  const sideMenuItems = articleCategories.map((section) => {
    const isActive = section.slugs.some((slug) => slug === ressourceKey);

    return {
      expandedByDefault: isActive,
      isActive,
      items: section.slugs.map((slug) => ({
        isActive: ressourceKey === slug,
        linkProps: {
          href: `/ressources/${slug}#contenu`,
          scroll: false,
        },
        text: articlesBySlug[slug].title,
      })),
      text: section.title,
    };
  });

  useEffect(() => {
    if (ressourceKey && !content) {
      void router.push('/ressources');
    }

    const handleRouteChange = (url: string) => {
      if (url.includes('#contenu')) {
        const element = document.getElementById('contenu');
        if (element) {
          element.scrollIntoView();
        }
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [content, router, ressourceKey]);

  return (
    <>
      <Hero variant="ressource" size="lg" imageType="inline" image="/img/ressources-right.svg" imageClassName="py-5" imagePosition="right">
        <HeroTitle as="h2">Découvrez les solutions de chauffage écologique</HeroTitle>
        <HeroSubtitle>Changez pour un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français !</HeroSubtitle>
      </Hero>
      <div id="contenu" />
      <StickyForm />
      <StickyWrapper>
        <Box as="main" className="fr-container fr-grid-row" my="4w">
          <Box className="fr-col-12 fr-col-md-3">
            <SideMenu burgerMenuButtonText="Dans cette rubrique" title="Aller plus loin :" items={sideMenuItems} />
          </Box>
          <Box className="fr-col-12 fr-col-md-9">
            <RessourceContent content={content} />
            <Guide />
          </Box>
        </Box>
      </StickyWrapper>
    </>
  );
};

export default Ressource;
