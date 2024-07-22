import { Highlight } from '@codegouvfr/react-dsfr/Highlight';
import Link from 'next/link';
import { LeftImage, List, Subtitle } from './Contents.styles';

const ClassedNetwork = () => {
  return (
    <>
      <Subtitle>Quels sont les réseaux concernés ?</Subtitle>
      Les lois Énergie Climat de 2019 et Climat et résilience de 2021 ont
      instauré le classement automatique des réseaux de chaleur.{' '}
      <b>
        Les réseaux de service public sont automatiquement classés s’ils
        satisfont trois critères :
      </b>
      <List>
        <li>
          <b>
            un taux d’énergies renouvelables et de récupération de plus de 50 %
             ;
          </b>
        </li>
        <li>
          <b>un comptage de la chaleur livrée ;</b>
        </li>
        <li>
          <b>un équilibre financier assuré.</b>
        </li>
      </List>
      592 réseaux sont concernés, listés dans l’arrêté du 22 décembre 2023
      relatif au classement des réseaux de chaleur et de froid. À noter que la
      collectivité peut toutefois faire le choix de s’opposer au classement, par
      une délibération motivée.
      <br />
      <br />
      <Subtitle>Quelles obligations s’appliquent pour ces réseaux ?</Subtitle>
      <b>
        Dans une certaine zone autour du réseau, qualifiée de périmètre de
        développement prioritaire, le raccordement au réseau de chaleur est
        obligatoire pour :
      </b>
      <List>
        <li>
          tout{' '}
          <b>
            bâtiment neuf dont les besoins en chauffage sont supérieurs à une
            certaine puissance
          </b>{' '}
          (30 kW ou plus) ;
        </li>
        <li>
          tout{' '}
          <b>
            bâtiment renouvelant son installation de chauffage au-dessus d’une
            certaine puissance
          </b>{' '}
          (30 kW ou plus).
        </li>
      </List>
      <br />
      Le seuil de puissance de 30 kW peut être relevé par la collectivité.
      <br />
      <br />
      Des dérogations peuvent être sollicitées auprès de la collectivité dans
      les cas suivants :
      <List>
        <li>
          besoins en chaleur incompatibles avec les caractéristiques techniques
          du réseau ;
        </li>
        <li>
          installation ne pouvant être alimentée par le réseau dans les délais
          nécessaires ;
        </li>
        <li>
          solution mise en œuvre alimentée par des énergies renouvelables et de
          récupération à un taux supérieur à celui du réseau classé ;
        </li>
        <li>
          coût manifestement disproportionné pour le raccordement et
          l’utilisation du réseau.
        </li>
      </List>
      <br />
      <Subtitle>
        Comment savoir si le réseau de chez moi est classé et quel est son
        périmètre de développement prioritaire ?
      </Subtitle>
      <Highlight>
        La{' '}
        <b>
          <Link href="/carte">cartographie France Chaleur Urbaine</Link> permet
          d’identifier les réseaux classés, et de prendre connaissance des
          périmètres de développement prioritaire
        </b>
        , dès lors que ceux-ci ont été transmis par les collectivités.
      </Highlight>
      <br />
      <LeftImage
        src="/img/FCU_Infographie_Classement.jpg"
        alt="Classement des réseaux de chaleur"
      />
    </>
  );
};

export default ClassedNetwork;
