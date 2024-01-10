import MarkdownWrapper from '@components/MarkdownWrapper';
import { Container, Image } from '@components/Press/index.styles';
import Slice from '@components/Slice';
import MainContainer from '@components/shared/layout/MainContainer';

const PressJanuary24 = () => {
  return (
    <MainContainer currentMenu="/communique-de-presse-janvier2024">
      <Container>
        <Slice padding={4}>
          <MarkdownWrapper
            value={`# Communiqué de presse
11 janvier 2024

# Près de 30% des logements à raccorder au chauffage urbain d’ici 2035 déjà identifiés par France Chaleur Urbaine
<br />

*Le projet de Stratégie française pour l’énergie et le climat du Gouvernement table sur 300 000 à 360* *000 logements à raccorder chaque année au chauffage urbain jusqu’en 2035, un objectif qui inclut les raccordements sur de nouveaux réseaux à créer. Sur les réseaux existants, France Chaleur Urbaine identifie déjà **1 257 300 logements potentiellement raccordables.***

Les réseaux de chaleur, aussi qualifiés de chauffage urbain, constituent l’un des leviers pour la décarbonation des bâtiments. Alimentés à plus de 66% par des énergies renouvelables et de récupération (géothermie, chaleur issue de l’incinération des ordures ménagères, biomasse…), ils émettent deux fois moins de gaz à effet de serre qu’un chauffage au gaz ou fioul<sup>1</sup>.

Pour qu’un bâtiment soit aisément raccordable à un réseau de chaleur, il doit satisfaire deux critères principaux : se situer à faible distance d’un réseau, et disposer d’un mode de chauffage déjà collectif (gaz ou fioul). Cependant pour atteindre les objectifs fixés à l’échelle nationale, le projet de Stratégie française pour l’énergie et le climat spécifie qu’une proportion notable de logements à chauffage individuel fossile devra également être raccordée, nécessitant des travaux plus conséquents au sein des bâtiments.

Alors que l’exercice de planification écologique mené à l’échelle nationale va être décliné aux échelons territoriaux dans les prochains mois, France Chaleur Urbaine vient d’évaluer le nombre de bâtiments et logements ainsi raccordables, sur la base du croisement de plusieurs jeux de données<sup>2</sup>. **Selon ces travaux, 653 000 logements actuellement équipés de chaudières collectives au fioul ou gaz pourraient être raccordés à un réseau de chaleur existant. Le potentiel double en incluant les logements à chauffage individuel gaz, atteignant 1 257 300 logements raccordables, soit près de 30% de l’objectif fixé à l’horizon 2035.** L’atteinte des objectifs nationaux ne pourra toutefois se faire sans la création de nouveaux réseaux de chaleur et la mise en place de moyens de production d’énergies renouvelables supplémentaires.

**Les résultats de ce travail sont visualisables par département et par région sur une carte dédiée mise en ligne par France Chaleur Urbaine,** et peuvent être librement téléchargés. La cartographie France Chaleur Urbaine permet également de visualiser l’ensemble des bâtiments pris en compte dans cette étude, et offre à chacun la possibilité de tester l’éligibilité au raccordement de son bâtiment.

- [Carte des potentiels](/carte?potentiels-de-raccordement)
- [Carte des réseaux et bâtiments](/carte)



<br />

**À propos de France Chaleur Urbaine, retrouvez notre [dossier de presse](/documentation/dossier-presse.pdf)**

Pour nous contacter : [france-chaleur-urbaine@developpement-durable.gouv.fr](mailto:france-chaleur-urbaine@developpement-durable.gouv.fr)

<br />
(1) Source : enquête annuelle des réseaux de chaleur et de froid réalisée par la FEDENE Réseaux de chaleur & froid avec le concours d’AMORCE,  sous la tutelle du Service des données et études statistiques (SDES) du ministère de la Transition énergétique (édition 2023)

<br />
<br />
(2) Ces résultats s’appuient sur le croisement de trois jeux de données :

- la cartographie nationale des réseaux de chaleur France Chaleur Urbaine, qui recense les tracés de 700 réseaux représentant plus de 90% des livraisons de chaleur annuelle ;
- la base de données nationale des bâtiments du Centre scientifique et technique du bâtiment (CSTB), qui contient la carte d’identité de 20 millions de bâtiments ;
- le registre national d’immatriculation des copropriétés de Agence nationale de l’habitat.


`}
          />
          <Image
            src="/img/FCU_Infographie_carte.jpg"
            alt="Carte France Chaleur Urbaine"
          />
        </Slice>
      </Container>
    </MainContainer>
  );
};

export default PressJanuary24;
