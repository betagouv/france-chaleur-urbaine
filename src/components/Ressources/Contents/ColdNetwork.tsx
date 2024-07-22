import { Highlight } from '@codegouvfr/react-dsfr/Highlight';
import Link from 'next/link';

import { List, Subtitle } from './Contents.styles';

const ColdNetwork = () => {
  return (
    <>
      <Subtitle>Comment fonctionne un réseau de froid ?</Subtitle>
      <b>Les réseaux de froid comportent :</b>
      <List>
        <li>
          <b>une centrale frigorifique,</b> qui peut produire le froid selon deux technologies :
          <List>
            <li>
              soit par des groupes froid à compression électrique : c’est le cas le plus courant (95% des réseaux). Exemple : réseau de
              froid de Lyon Centre géré par Dalkia{' '}
            </li>
            <li>
              soit par des groupes froid à absorption, utilisant une source chaude (5% des réseaux seulement). Exemple : réseau de froid de
              la Cartoucherie à Toulouse géré par Eneriance (Coriance) ;
            </li>
          </List>
        </li>
        <li>
          <b>une réserve de glace et eau glacée,</b> qui permet de limiter l’usage de la centrale frigorifique pendant les heures de
          pointe ;
        </li>
        <li>
          <b>un réseau de distribution,</b> qui achemine l’eau glacée entre les sites de production et les bâtiments ;
        </li>
        <li>
          <b>des sous-stations d’échange</b> au pied des bâtiments, qui assurent le transfert de l’énergie du réseau de froid vers le
          circuit interne à chaque bâtiment.
        </li>
      </List>
      <br />
      <Highlight>
        <b>Le réseau de froid peut aussi avoir recours à des éléments du milieu naturel (lac, rivière, mer, sous-sol…)</b> pour le
        refroidissement du fluide caloporteur : c’est ce qu’on appelle le Free cooling. À titre d’exemple, une partie significative des
        besoins du réseau de froid de Paris sont fournis par la Seine.
      </Highlight>
      <br />
      <Subtitle> Quels sont les atouts des réseaux de froid ?</Subtitle>
      Les réseaux de froid présentent de nombreux avantages :
      <List>
        <li>
          <b>Efficacité énergétique :</b>
          <List>
            <li>
              centralisation des moyens de production de froid, permettant de recourir à des machines industrielles à très haut rendement
              énergétique, 1.5 à 3 fois supérieur aux installations autonomes
            </li>
            <li>mise en marche des groupes de froid en fonction des besoins réels</li>
            <li>
              consommations électriques pour la production de froid reportables aux heures creuses, grâce au stockage de glace et eau glacée
            </li>
            <li>recours à des sources de froid naturelles permettant de limiter l’usage des groupes frigorifiques</li>
          </List>
        </li>
        <li>
          <b>Sécurité et fiabilité</b>
          <List>
            <li>réduction des risques sanitaires liés aux légionelles, pouvant apparaître avec des climatiseurs mal entretenus</li>
            <li>maintenance assurée par les gestionnaires des réseaux</li>
          </List>
        </li>
        <li>
          <b>Environnement</b>
          <List>
            <li>suppression des contraintes visuelles et sonores associées aux climatiseurs individuels et gain de place</li>
            <li>
              atténuation des effets d’îlots de chaleur urbains, auquel les réseaux de froid ne contribuent pas (contrairement aux systèmes
              autonomes)
            </li>
            <li>
              très faibles émissions de gaz à effet de serre, grâce à la maîtrise des fluides frigorigènes (fortement émetteurs de CO2) et à
              des contenus CO2 pour la production du froid réduits (11g/kWh livré en moyenne).
            </li>
          </List>
        </li>
      </List>
      <br />
      <Subtitle>Que représentent aujourd’hui les réseaux de froid en France ? Quels sont leurs objectifs de développement ?</Subtitle>
      <b>En 2021, on comptabilise 1445 bâtiments raccordés à l’un des 35 réseaux de froid français</b> (0.78 TWh de froid livré).
      <br />
      <br />
      Les réseaux de froid alimentent majoritairement des <b>bâtiments du secteur tertiaire</b> (88%), en particulier les bureaux, les
      hôpitaux, les universités, les aéroports. Ils rafraichissent de manière plus marginale des bâtiments des secteurs résidentiel (0,3%)
      et industriel (12%).
      <br />
      <br />
      <Highlight>
        Dans un contexte de réchauffement climatique et d’urbanisation croissante, les réseaux de froid sont amenés à se développer. La
        programmation pluriannuelle de l’énergie de 2020 fixe pour objectif un triplement des livraisons de froid par les réseaux à
        l’horizon 2028, par rapport à 2016.
      </Highlight>
      <br />
      <Subtitle>Comment savoir si un réseau de froid passe près de mon bâtiment et m’y raccorder ?</Subtitle>
      France Chaleur Urbaine intègre progressivement les tracés des réseaux de froid dans sa <Link href="/carte">cartographie</Link>.{' '}
      <b>
        En renseignant votre adresse et en activant la couche “Réseaux de froid”, vous pourrez donc visualiser si un réseau de froid passe à
        proximité de votre adresse.
      </b>{' '}
      Pour connaître les possibilités de raccordement, il convient de se rapprocher du gestionnaire du réseau.
      <br />
      <br />
      <Subtitle>Quelles sont les aides pour financer un raccordement à un réseau de froid ?</Subtitle>
      Il est possible de financer une partie des frais de raccordement d’un bâtiment tertiaire au réseau de froid grâce à la prime CEE{' '}
      <b>“Raccordement d’un bâtiment tertiaire existant à un réseau de froid”</b> (fiche BAT-TH-159). Si le bâtiment remplit les conditions,
      il convient de se rapprocher des obligés proposant cette offre pour en bénéficier.
      <br />
      <b>Attention, cette prime CEE ne concerne pas les bâtiments résidentiels.</b>
      <br />
      <br />
      <img src="/img/FCU_Infographie_Froid.jpg" alt="Les réseaux de froid" />
    </>
  );
};

export default ColdNetwork;
