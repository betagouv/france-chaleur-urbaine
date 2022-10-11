import {
  Col,
  Container,
  Row,
  SideMenu,
  SideMenuItem,
  SideMenuLink,
} from '@dataesr/react-dsfr';
import { enjeux } from './Documents.config';
import Guide from './Guide';
import Header from './Header';
import { StickyWrapper } from './Ressource.styles';
import RessourceContent from './RessourceContent';
import StickyForm from './StickyForm';

const getContent = (ressourceKey: string) => {
  return enjeux[ressourceKey];
};

const Ressource = ({ ressourceKey }: { ressourceKey: string }) => {
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
            <Col n="md-4 12">
              <SideMenu
                title="Aller plus loin :"
                buttonLabel="Aller plus loin :"
              >
                <SideMenuItem
                  title="Les enjeux de la transition énergétique avec les réseaux de chaleur"
                  expandedDefault
                  current={Object.keys(enjeux).includes(ressourceKey)}
                >
                  {Object.entries(enjeux).map(([key, document]) => (
                    <SideMenuLink
                      key={key}
                      href={`/ressources/${key}`}
                      current={ressourceKey === key}
                    >
                      {document.title}
                    </SideMenuLink>
                  ))}
                </SideMenuItem>
              </SideMenu>
            </Col>
            <Col n="8">
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
