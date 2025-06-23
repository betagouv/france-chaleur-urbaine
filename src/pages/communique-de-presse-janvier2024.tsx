import { StyledIFrameLink } from '@/components/IFrame/Map/IFrameMapIntegrationForm.styles';
import MarkdownWrapper from '@/components/MarkdownWrapper';
import { Container, Image } from '@/components/Press/index.styles';
import SimplePage from '@/components/shared/page/SimplePage';
import Slice from '@/components/Slice';

const PressJanuary24 = () => {
  return (
    <SimplePage
      title="Communiqué de presse - Janvier 2024"
      description="Près de 30% des logements à raccorder au chauffage urbain d’ici 2035 identifiés par France Chaleur Urbaine"
    >
      <Container>
        <Slice padding={4}>
          <MarkdownWrapper
            value={`# Communiqué de presse
11 janvier 2024

# Près de 30% des logements à raccorder au chauffage urbain d’ici 2035 identifiés par France Chaleur Urbaine
<br />

#### Le projet de Stratégie française pour l’énergie et le climat du Gouvernement table sur 300 000 à 360 000 logements à raccorder chaque année au chauffage urbain jusqu’en 2035, un objectif qui inclut les raccordements sur de nouveaux réseaux à créer. Sur les réseaux existants, France Chaleur Urbaine identifie déjà <strong-inherit>1 275 300 logements potentiellement raccordables</strong-inherit>.

Les réseaux de chaleur, aussi qualifiés de chauffage urbain, constituent l’un des leviers pour la décarbonation des bâtiments. Alimentés à plus de 66% par des énergies renouvelables et de récupération (géothermie, chaleur issue de l’incinération des ordures ménagères, biomasse…), ils émettent deux fois moins de gaz à effet de serre qu’un chauffage au gaz ou fioul<sup><a href="#source-1">1</a></sup>.

Pour qu’un bâtiment soit aisément raccordable à un réseau de chaleur, il doit satisfaire deux critères principaux : se situer à faible distance d’un réseau, et disposer d’un mode de chauffage déjà collectif (gaz ou fioul). Cependant pour atteindre les objectifs fixés à l’échelle nationale, le projet de Stratégie française pour l’énergie et le climat spécifie qu’une proportion notable de logements à chauffage individuel fossile devra également être raccordée, nécessitant des travaux plus conséquents au sein des bâtiments.

Alors que l’exercice de planification écologique mené à l’échelle nationale va être décliné aux échelons territoriaux dans les prochains mois, France Chaleur Urbaine vient d’évaluer le nombre de bâtiments et logements ainsi raccordables, sur la base du croisement de plusieurs jeux de données<sup><a href="#source-2">2</a></sup>. **Selon ces travaux, 653 000 logements actuellement équipés de chaudières collectives au fioul ou gaz pourraient être raccordés à un réseau de chaleur existant. Le potentiel double en incluant les logements à chauffage individuel gaz, atteignant 1 275 300 logements raccordables, soit près de 30% de l’objectif fixé à l’horizon 2035.** L’atteinte des objectifs nationaux ne pourra toutefois se faire sans la création de nouveaux réseaux de chaleur et la mise en place de moyens de production d’énergies renouvelables supplémentaires.

**Les résultats de ce travail sont visualisables par département et par région sur une carte dédiée mise en ligne par France Chaleur Urbaine,** et peuvent être librement téléchargés. La cartographie France Chaleur Urbaine permet également de visualiser l’ensemble des bâtiments pris en compte dans cette étude, et offre à chacun la possibilité de tester l’éligibilité au raccordement de son bâtiment.

- <a href="/carte?potentiels-de-raccordement" target="_blank">Carte des potentiels</a>
- <a href="/carte" target="_blank">Carte des réseaux et bâtiments</a> (activer le mode professionnel)
<br />
<br />

<div><em>Il est possible d’intégrer le test d’adresse France Chaleur Urbaine dans n’importe quelle page web en copiant-collant la ligne suivante dans le code source de la page :</em></div>
`}
          />

          <StyledIFrameLink
            className="fr-mt-1w"
            link={`<iframe title="France chaleur urbaine - Éligibilité" src="https://france-chaleur-urbaine.beta.gouv.fr/form" width="100%" height="330"></iframe>`}
          />
          <Image className="fr-mt-3w" src="/img/FCU_Infographie_carte.jpg" alt="Carte France Chaleur Urbaine" />
          <MarkdownWrapper
            value={`
<br />
<div id="source-1">(1) Source : enquête annuelle des réseaux de chaleur et de froid réalisée par la FEDENE Réseaux de chaleur & froid avec le concours d’AMORCE,  sous la tutelle du Service des données et études statistiques (SDES) du ministère de la Transition écologique (édition 2023)</div>

<br />

<div id="source-2">(2) Ces résultats s’appuient sur le croisement de trois jeux de données :</div>

- la cartographie nationale des réseaux de chaleur France Chaleur Urbaine, qui recense les tracés de 700 réseaux représentant plus de 90% des livraisons de chaleur annuelle ;
- la base de données nationale des bâtiments du Centre scientifique et technique du bâtiment (CSTB), qui contient la carte d’identité de 20 millions de bâtiments ;
- le registre national d’immatriculation des copropriétés de Agence nationale de l’habitat.

`}
          />
        </Slice>
      </Container>
    </SimplePage>
  );
};

export default PressJanuary24;
