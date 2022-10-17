import { List, Source, Subtitle } from './Contents.styles';

const Priority = () => {
  return (
    <>
      Dans la zone délimitée par le périmètre de développement prioritaire,{' '}
      <b>
        tout bâtiment neuf ou faisant l’objet de travaux de rénovation
        importants a l’obligation de se raccorder au réseau classé.
      </b>
      <br />
      <br />
      <Subtitle> Est considéré comme bâtiment neuf :</Subtitle>
      Un bâtiment nouvellement construit dont{' '}
      <b>
        la demande de permis de construire a été déposée postérieurement à la
        décision de classement
      </b>
      , ou une partie nouvelle de bâtiment, ou surélévation (excédant 150 m ² ou
      30 % de la surface des locaux existants) et dont les besoins{' '}
      <b>
        de chauffage de locaux, de climatisation ou de production d’eau chaude
        excèdent un niveau de puissance de 30 kilowatts.
      </b>
      <br />
      <br />
      <Subtitle>
        Est considéré comme bâtiment faisant l’objet de travaux de rénovation
        importants :
      </Subtitle>
      a) un bâtiment dans lequel{' '}
      <b>
        est remplacée l'installation de chauffage ou de refroidissement d'une
        puissance supérieure à 30 kilowatts.
      </b>
      <br />
      <br />
      b) un bâtiment dans lequel{' '}
      <b>
        est remplacée une installation industrielle de production de chaleur ou
        de froid d'une puissance supérieure à 30 kilowatts.
      </b>
      <br />
      <br />
      À noter : certaines collectivités choisissent de relever le seuil de
      puissance au-dessus duquel le raccordement est obligatoire.
      <br />
      <br />
      Des dérogations au raccordement obligatoire sont possibles, qui doivent
      alors faire l’objet d’une demande à l’autorité compétente (collectivité).
      Elles sont accordées dans les cas suivants :
      <List>
        <li>
          Des caractéristiques techniques incompatibles avec celle du réseau
        </li>
        <li>
          Des délais de mise en œuvre trop longs (sauf si l’exploitant justifie
          la mise en place d’une solution transitoire permettant l’alimentation
          en chauffage des usagers)
        </li>
        <li>
          La mise en place d’une solution de chauffage alternative plus
          vertueuse (taux d’énergies renouvelables et de récupération équivalent
          ou supérieur à celui du réseau classé)
        </li>
        <li>
          Un coût manifestement disproportionné comparé à d’autres solutions de
          chauffage
        </li>
      </List>
      <Source>
        Sources : articles L.712-3, R.712-9 et R.712-10 du code de l’énergie
      </Source>
    </>
  );
};

export default Priority;
