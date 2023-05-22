import { Glass, ImageContainer } from '@components/Infographie/index.styles';
import { matomoEvent } from '@components/Markup';
import WrappedText from '@components/WrappedText/WrappedText';
import { Button, Icon } from '@dataesr/react-dsfr';
import { Container, Title } from './Explanation.styles';

const Explanation = () => {
  return (
    <>
      <Title>
        <h2>
          Un chauffage <b>écologique</b> à <b>prix compétitif</b> déjà adopté
          par 6 millions de Français
        </h2>
      </Title>
      <Container>
        <div className="fr-col-12 fr-col-md-6 fr-col-lg-7">
          <WrappedText
            body={`
### Un réseau de chauffage urbain, c’est quoi ?
::arrow-item[Un [réseau de chaleur](/reseaux-chaleur#contenu) est un **système de canalisations souterraines qui permettent d'acheminer vers des bâtiments de la chaleur** produite localement, avec des [énergies renouvelables et de récupération](/ressources/energies-vertes#contenu) (Incinération des ordures ménagères, biomasse, géothermie...).]
::arrow-item[Cette chaleur est transportée jusqu'à **une sous-station installée dans votre copropriété**, qui assure le transfert avec les canalisations internes à l’immeuble, desservant les différents logements.]
::arrow-item[Dans la plupart des cas, **le réseau de chaleur appartient à une collectivité territoriale et est géré en concession par un exploitant**, qui s’occupe notamment des raccordements.]
::arrow-item[**France Chaleur Urbaine**, service du ministère de la transition énergétique, **vous informe et vous met en relation** avec le gestionnaire du réseau le plus proche de chez vous.]
`}
          />
          <div className="fcuCoproGuide">
            <img src="/img/copro_guide.png" alt="Guide de raccordement" />
            <div>
              <Button
                onClick={() => {
                  matomoEvent([
                    'Téléchargement',
                    'Guide FCU',
                    'coproprietaire',
                  ]);
                  window.open(
                    '/documentation/guide-france-chaleur-urbaine.pdf',
                    '_blank'
                  );
                }}
              >
                Télécharger notre guide
              </Button>
            </div>
          </div>
        </div>
        <div className="fr-col-12 fr-col-md-6 fr-offset-lg-1 fr-col-lg-4">
          <ImageContainer href="/img/FCU_Infographie.jpg" target="_blank">
            <img
              width="100%"
              src="/img/FCU_Infographie_small.jpeg"
              alt="Une solution d'avenir"
            />
            <Glass>
              <Icon name="ri-search-eye-fill" size="2x" />
            </Glass>
          </ImageContainer>
        </div>
      </Container>
    </>
  );
};

export default Explanation;
