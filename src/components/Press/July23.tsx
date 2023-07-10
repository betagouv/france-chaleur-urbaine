import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import { Container, Image } from './index.styles';

const July2023 = () => {
  return (
    <Container>
      <Slice padding={4}>
        <MarkdownWrapper
          value={`# Communiqué de presse
10 juillet 2023
# Les réseaux de froid : une solution écologique pour lutter contre la chaleur en ville
<br />

### France Chaleur Urbaine s’ouvre aux réseaux de froid et offre l'unique cartographie de ces réseaux. Les réseaux de froid sont aujourd'hui la seule alternative écologique aux climatiseurs individuels énergivores et sont amenés à un fort développement avec pour objectif un triplement des livraisons de froid à l’horizon 2028, par rapport à 2016.

Aujourd’hui, le réchauffement climatique et le vieillissement de la population font du refroidissement des bâtiments un enjeu crucial. Les réseaux de froid constituent une solution écologique pour y répondre : ils permettent de rafraichir un ensemble de bâtiments avec des émissions de CO2 réduites et en évitant les phénomènes d’îlots de chaleur urbaine.

**En 2021, on comptabilise 1445 bâtiments raccordés à l’un des 35 réseaux de froid français (0.78 TWh de froid livré). Selon les objectifs fixés par la programmation pluriannuelle de l’énergie (PPE), les livraisons de froid par les réseaux doivent atteindre 3 TWh par an au terme des cinq prochaines années.**

Constitués de canalisations souterraines qui permettent d’acheminer du froid vers un ensemble de bâtiments, ces réseaux alimentent majoritairement des bâtiments du secteur tertiaire (88%), en particulier les bureaux, les hôpitaux, les universités, les aéroports. Ils rafraichissent de manière plus marginale des bâtiments des secteurs résidentiel (0,3%) et industriel (12%).

Leurs avantages sont nombreux :

- Optimisation de la production de froid (centralisation permettant de recourir à des machines industrielles à très haut rendement énergétique, production en fonction des besoins réels et reportable aux heures creuses, …)
- Exploitation de sources de froid naturelles et renouvelables (technologie du “free-cooling”)
- Très faibles émissions de gaz à effet de serre, grâce à la maîtrise des fluides frigorigènes (fortement émetteurs de CO2) et à des contenus CO2 pour la production du froid réduits (11g/kWh livré en moyenne).
- Réduction des effets d’îlots de chaleur urbains, auquel les réseaux de froid ne contribuent pas, contrairement aux climatisations individuelles
- Tarifs compétitifs, là où les climatiseurs individuels sont fortement consommateurs d’électricité, dont les prix sont en constante augmentation.

Il s’agit d’un secteur en pleine croissance avec la mise en fonctionnement de réseaux innovants comme celui déployé par IDEX à Annecy (74), où l’eau du lac est utilisée pour refroidir les bâtiments grâce au “free-cooling”. Ce nouveau réseau permet d’assurer 100% des besoins en climatisation des bâtiments raccordés, estimés à 500 MWh par an. Le réseau de froid de Paris, Fraîcheur de Paris, premier réseau au niveau européen, utilise aussi le “free-cooling” avec l’eau de la Seine et distribue 370 GWh par an d'énergie frigorifique à 738 abonnés : hôtels, grands magasins, bureaux, musées de la capitale…

**Grâce à la [cartographie](/carte) du service public France Chaleur Urbaine, il est désormais possible de visualiser la localisation des réseaux de froid pour envisager le raccordement à l’un de ces réseaux. France Chaleur Urbaine s’attache également à faire connaître ce mode de refroidissement, grâce à des [supports pédagogiques](/ressources/supports#contenu) (infographie, fiche reportage,…).**

Voir notre [page dédiée aux réseaux de froid](/ressources/reseau-de-froid#contenu)


**À propos de France Chaleur Urbaine, retrouvez notre [dossier de presse](/documentation/dossier-presse.pdf)**

Pour nous contacter : [france-chaleur-urbaine@developpement-durable.gouv.fr](mailto:france-chaleur-urbaine@developpement-durable.gouv.fr)
`}
        />
        <Image
          src="/img/FCU_Infographie_Froid.jpg"
          alt="Les réseaux de froid"
        />
      </Slice>
    </Container>
  );
};

export default July2023;
