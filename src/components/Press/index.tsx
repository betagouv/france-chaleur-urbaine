import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import { Container } from './index.styles';

const Press = () => {
  return (
    <Container>
      <Slice padding={4}>
        <MarkdownWrapper
          value={`# Communiqué de presse
14 mars 2023
## Le chauffage urbain, l’avenir du chauffage
### Fin du monde, fin du mois, la solution est sous nos pieds
#### Découvrez ce mode de chauffage méconnu et caché sous terre qui s’avère être le moins cher et l’un des plus écologiques du marché
Passer l’hiver au chaud sans chauffer ni la planète ni sa facture, c’est possible. 
**Se raccorder à un réseau de chauffage urbain peut faire baisser le coût du chauffage de 40% et les émissions de gaz à effet de serre de 50%**. 

La nouvelle enquête de l’association Amorce qui vient de sortir le confirme à nouveau, **le chauffage urbain est bien le mode de chauffage le moins cher sur le marché** loin devant le gaz, l’électricité et le fioul dont les tarifs ne cessent d’augmenter. En 2021, le coût annuel chauffage + eau chaude sanitaire pour un logement moyen raccordé à un réseau de chaleur s’est ainsi élevé à 1036 €, contre 1200 € pour un logement chauffé au gaz collectif, 1550 € pour un chauffage électrique et 1843 € pour un chauffage au fioul !  

Alors que l’urgence climatique est sans précédent, les réseaux de chaleur permettent déjà d’éviter chaque année l’émission de plus de 6 millions de tonnes de CO2, soit l’équivalent de 11,6 millions d’aller-retours Paris-New-York (source : SNCU). Un effort considérable a été réalisé pour verdir ces réseaux, aujourd’hui alimentés à plus de 62% par des énergies renouvelables et de récupération. Cet effort va se poursuivre dans les prochaines années, notamment dans le cadre du plan national géothermie récemment annoncé par le Gouvernement. 

Pourtant, les réseaux de chaleur, ces **canalisations souterraines** qui servent à acheminer de la chaleur renouvelable ou de récupération depuis une unité de production locale (installation géothermique, incinérateur de déchets, chaufferie biomasse etc.) vers les bâtiments qui lui sont raccordés, souffrent historiquement d’un manque de visibilité, auprès du grand public en général et des copropriétaires en particulier. Et ce alors même qu’il existe aujourd’hui une obligation de raccordement pour certains bâtiments…

Le service public **France Chaleur Urbaine, entièrement financé par l’État,** a pour mission de faire connaître le chauffage urbain et de faciliter raccordements. Il se place ainsi en tiers de confiance entre les copropriétaires et les gestionnaires des réseaux. Il permet à chacun de déterminer **en quelques clics si un raccordement est envisageable pour son immeuble** et le cas échéant **d’être mis en contact, gratuitement et sans engagement, avec le bon interlocuteur pour concrétiser le raccordement.** 

**A propos de France Chaleur Urbaine, retrouvez [notre dossier de presse ici](/documentation/dossier-presse.pdf)**

Pour nous contacter : [france-chaleur-urbaine@developpement-durable.gouv.fr](mailto:france-chaleur-urbaine@developpement-durable.gouv.fr)`}
        />
        <img
          src="/img/FCU_Infographie_Menage.jpg"
          alt="Les ménages français et le chauffage"
        />
      </Slice>
    </Container>
  );
};

export default Press;
