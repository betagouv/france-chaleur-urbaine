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
import { growths, issues, understandings } from './config';
import Guide from './Guide';
import Header from './Header';
import { SideMenu, StickyWrapper } from './Ressource.styles';
import RessourceContent from './RessourceContent';
import StickyForm from './StickyForm';

const getContent = (ressourceKey: string) => {
  return (
    issues[ressourceKey] ||
    understandings[ressourceKey] ||
    growths[ressourceKey]
  );
};

const Ressource = ({ ressourceKey }: { ressourceKey: string }) => {
  const router = useRouter();
  useEffect(() => {
    if (ressourceKey && !getContent(ressourceKey)) {
      router.push('/ressources');
    }
  }, [router, ressourceKey]);

  return (
    <>
      <Header
        title="Découvrez les réseaux de chaleur"
        description="Changez pour un chauffage écologique à prix compétitif  déjà adopté par 6 millions de Français !"
      />
      <StickyForm />
      <StickyWrapper>
        <Container className="fr-my-4w">
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
                        <Link href={`/ressources/${key}`}>
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
                          <Link href={`/ressources/${key}`}>
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
                        <Link href={`/ressources/${key}`}>
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
              </SideMenu>
            </Col>
            <Col n="md-9 12">
              <RessourceContent content={getContent(ressourceKey)} />
              <Guide />
            </Col>
          </Row>
        </Container>
      </StickyWrapper>
    </>
  );
};

export default Ressource;
