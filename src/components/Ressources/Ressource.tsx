import {
  Col,
  Container,
  Row,
  SideMenuItem,
  SideMenuLink,
} from '@dataesr/react-dsfr';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Guide from './Guide';
import Header from './Header';
import { SideMenu, StickyWrapper } from './Ressource.styles';
import RessourceContent from './RessourceContent';
import StickyForm from './StickyForm';
import {
  coldNetworks,
  growths,
  issues,
  supports,
  understandings,
} from './config';

const getContent = (ressourceKey: string) => {
  if (ressourceKey === 'supports') {
    return supports;
  }

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

  return (
    <>
      <Header
        title="Découvrez les réseaux de chaleur"
        description="Changez pour un chauffage écologique à prix compétitif déjà adopté par 6 millions de Français !"
      />
      <div id="contenu" />
      <StickyForm />
      <StickyWrapper>
        <Container className="fr-my-4w" as="main">
          <Row>
            <Col n="md-3 12">
              <SideMenu title="Aller plus loin :" buttonLabel="Sommaire">
                <SideMenuItem
                  title="Les enjeux de la transition énergétique avec les réseaux de chaleur"
                  expandedDefault
                  current={Object.keys(issues).includes(ressourceKey)}
                >
                  {Object.entries(issues).map(([key, issue]) => (
                    <SideMenuLink
                      key={key}
                      asLink={
                        <Link
                          href={`/ressources/${key}#contenu`}
                          scroll={false}
                          legacyBehavior
                        >
                          <a
                            className="fr-sidemenu__link fr-link--md"
                            aria-current={
                              ressourceKey === key ? 'page' : undefined
                            }
                          >
                            {issue.title}
                          </a>
                        </Link>
                      }
                      current={ressourceKey === key}
                    >
                      {issue.title}
                    </SideMenuLink>
                  ))}
                </SideMenuItem>
                <SideMenuItem
                  title="Les réseaux de chaleur en pratique : tout comprendre pour se raccorder"
                  expandedDefault
                  current={Object.keys(understandings).includes(ressourceKey)}
                >
                  {Object.entries(understandings).map(
                    ([key, understanding]) => (
                      <SideMenuLink
                        key={key}
                        asLink={
                          <Link
                            href={`/ressources/${key}#contenu`}
                            scroll={false}
                            legacyBehavior
                          >
                            <a
                              className="fr-sidemenu__link fr-link--md"
                              aria-current={
                                ressourceKey === key ? 'page' : undefined
                              }
                            >
                              {understanding.title}
                            </a>
                          </Link>
                        }
                        current={ressourceKey === key}
                      >
                        {understanding.title}
                      </SideMenuLink>
                    )
                  )}
                </SideMenuItem>
                <SideMenuItem
                  title="Une filière en pleine croissance"
                  expandedDefault
                  current={Object.keys(growths).includes(ressourceKey)}
                >
                  {Object.entries(growths).map(([key, growth]) => (
                    <SideMenuLink
                      key={key}
                      asLink={
                        <Link
                          href={`/ressources/${key}#contenu`}
                          scroll={false}
                          legacyBehavior
                        >
                          <a
                            className="fr-sidemenu__link fr-link--md"
                            aria-current={
                              ressourceKey === key ? 'page' : undefined
                            }
                          >
                            {growth.title}
                          </a>
                        </Link>
                      }
                      current={ressourceKey === key}
                    >
                      {growth.title}
                    </SideMenuLink>
                  ))}
                </SideMenuItem>
                <SideMenuItem
                  title="Les réseaux de froid, un enjeu pour l'avenir"
                  expandedDefault
                  current={Object.keys(coldNetworks).includes(ressourceKey)}
                >
                  {Object.entries(coldNetworks).map(([key, resource]) => (
                    <SideMenuLink
                      key={key}
                      asLink={
                        <Link
                          href={`/ressources/${key}#contenu`}
                          scroll={false}
                          legacyBehavior
                        >
                          <a
                            className="fr-sidemenu__link fr-link--md"
                            aria-current={
                              ressourceKey === key ? 'page' : undefined
                            }
                          >
                            {resource.title}
                          </a>
                        </Link>
                      }
                      current={ressourceKey === key}
                    >
                      {resource.title}
                    </SideMenuLink>
                  ))}
                </SideMenuItem>
                <SideMenuItem
                  title="Nos supports de communication"
                  expandedDefault
                  current={ressourceKey === 'supports'}
                >
                  <SideMenuLink
                    asLink={
                      <Link
                        href={`/ressources/supports#contenu`}
                        scroll={false}
                        legacyBehavior
                      >
                        <a
                          className="fr-sidemenu__link fr-link--md"
                          aria-current={
                            ressourceKey === 'supports' ? 'page' : undefined
                          }
                        >
                          Retrouvez ici tous nos supports de communication à
                          partager autour de vous !
                        </a>
                      </Link>
                    }
                    current={ressourceKey === 'supports'}
                  >
                    Retrouvez ici tous nos supports de communication à partager
                    autour de vous !
                  </SideMenuLink>
                </SideMenuItem>
              </SideMenu>
            </Col>
            <Col n="md-9 12">
              <RessourceContent content={getContent(ressourceKey)} />
              {ressourceKey !== 'supports' && <Guide />}
            </Col>
          </Row>
        </Container>
      </StickyWrapper>
    </>
  );
};

export default Ressource;
