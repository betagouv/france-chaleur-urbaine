import Box from '@components/ui/Box';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import StickyForm from '../StickyForm/StickyForm';
import Guide from './Guide';
import Header from './Header';
import { SideMenu, StickyWrapper } from './Ressource.styles';
import RessourceContent from './RessourceContent';
import { coldNetworks, growths, issues, understandings } from './config';

const getContent = (ressourceKey: string) => {
  return (
    issues[ressourceKey] ||
    understandings[ressourceKey] ||
    growths[ressourceKey] ||
    coldNetworks[ressourceKey]
  );
};

const Ressource = ({ ressourceKey }: { ressourceKey: string }) => {
  const router = useRouter();
  useEffect(() => {
    if (ressourceKey && !getContent(ressourceKey)) {
      router.push('/ressources');
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
  }, [router, ressourceKey]);

  const selected = {
    issues: Object.keys(issues).includes(ressourceKey),
    understandings: Object.keys(understandings).includes(ressourceKey),
    growths: Object.keys(growths).includes(ressourceKey),
    coldNetworks: Object.keys(coldNetworks).includes(ressourceKey),
  };

  return (
    <>
      <Header
        title="Découvrez les réseaux de chaleur"
        description="Changez pour un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français !"
      />
      <div id="contenu" />
      <StickyForm />
      <StickyWrapper>
        <Box as="main" className="fr-container fr-grid-row" my="4w">
          <Box className="fr-col-12 fr-col-md-3">
            <SideMenu
              burgerMenuButtonText="Dans cette rubrique"
              title="Aller plus loin :"
              items={[
                {
                  text: 'Les enjeux de la transition énergétique avec les réseaux de chaleur',
                  isActive: selected.issues,
                  expandedByDefault: selected.issues,
                  items: Object.entries(issues).map(([key, issue]) => ({
                    text: issue.title,
                    isActive: ressourceKey === key,
                    linkProps: {
                      href: `/ressources/${key}#contenu`,
                      scroll: false,
                    },
                  })),
                },
                {
                  text: 'Les réseaux de chaleur en pratique : tout comprendre pour se raccorder',
                  isActive: selected.understandings,
                  expandedByDefault: selected.understandings,
                  items: Object.entries(understandings).map(([key, issue]) => ({
                    text: issue.title,
                    isActive: ressourceKey === key,
                    linkProps: {
                      href: `/ressources/${key}#contenu`,
                      scroll: false,
                    },
                  })),
                },
                {
                  text: 'Une filière en pleine croissance',
                  isActive: selected.growths,
                  expandedByDefault: selected.growths,
                  items: Object.entries(growths).map(([key, issue]) => ({
                    text: issue.title,
                    isActive: ressourceKey === key,
                    linkProps: {
                      href: `/ressources/${key}#contenu`,
                      scroll: false,
                    },
                  })),
                },
                {
                  text: "Les réseaux de froid, un enjeu pour l'avenir",
                  isActive: selected.coldNetworks,
                  expandedByDefault: selected.coldNetworks,
                  items: Object.entries(coldNetworks).map(([key, issue]) => ({
                    text: issue.title,
                    isActive: ressourceKey === key,
                    linkProps: {
                      href: `/ressources/${key}#contenu`,
                      scroll: false,
                    },
                  })),
                },
                {
                  text: 'Nos supports de communication',
                  linkProps: {
                    href: `/ressources/supports`,
                  },
                },
              ]}
            />
          </Box>
          <Box className="fr-col-12 fr-col-md-9">
            <RessourceContent content={getContent(ressourceKey)} />
            <Guide />
          </Box>
        </Box>
      </StickyWrapper>
    </>
  );
};

export default Ressource;
