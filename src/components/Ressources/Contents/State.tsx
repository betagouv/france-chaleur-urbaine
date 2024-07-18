import { Highlight } from '@codegouvfr/react-dsfr/Highlight';
import { List, Subtitle } from './Contents.styles';

const State = () => {
  return (
    <>
      <Subtitle>Le Fonds Chaleur</Subtitle>
      Le soutien financier de l’État au développement de la chaleur renouvelable
      passe principalement par{' '}
      <b>le Fonds Chaleur, géré par l’ADEME depuis 2009</b>. Ce Fonds permet
      notamment de financer les installations de production de chaleur
      renouvelable et de récupération ainsi que les réseaux de chaleur liés à
      ces installations (projets portés par des collectivités et entreprises).{' '}
      <b>
        L’objectif est de permettre à la chaleur renouvelable d’être compétitive
        par rapport à celle produite à partir d’énergies fossiles
      </b>
      . Depuis sa création en 2009, le Fonds Chaleur a permis de quasiment
      doubler la longueur des réseaux de chaleur en France, passée de 3450 km à
      près de 6200 km.
      <br />
      <br />
      <b>En quelques chiffres :</b>
      <List>
        <li>
          2,9 milliards d’euros attribués sur 10,6 milliards d’euros investis
          entre 2009 et 2021.
        </li>
        <li>
          6566 opérations accompagnées et financées entre 2009 et 2021, dont
          1253 projets de réseaux de chaleur et de froid (création, extension…),
          829 installations géothermiques, 1853 chaufferies biomasse, 151
          projets de récupération de chaleur fatale.
        </li>
        <li>
          un budget croissant : 250 M€ en 2018, 307 M€ en 2019, 350 M€ en 2020
          et 2021
        </li>
      </List>
      <br />
      <b>Le Fonds Chaleur comprend :</b>
      <List>
        <li>des aides à l’investissement.</li>
        <li>
          des aides pour accompagner les porteurs dans leur réflexion et leur
          prise de décision : schéma directeur des réseaux de chaleur, études de
          faisabilité technico-économique, missions d’assistance à maîtrise
          d’ouvrage...
        </li>
      </List>
      <br />
      Pour en savoir plus :{' '}
      <a
        href="https://fondschaleur.ademe.fr/le-fonds-chaleur/"
        target="_blank"
        rel="noreferrer"
      >
        https://fondschaleur.ademe.fr/le-fonds-chaleur/
      </a>
      <br />
      <br />
      <Subtitle>Un taux de TVA réduit</Subtitle>
      <Highlight>
        Le prix de vente de la chaleur livrée par les réseaux comprend une part
        variable fonction de la consommation (R1) et une part fixe (abonnement),
        généralement fonction de la puissance souscrite (R2). La part variable
        (R1) est soumise à une TVA réduite (5,5 % au lieu de 20%) dès lors que
        le réseau de chaleur est alimenté à plus de 50 % par des énergies
        renouvelables et de récupération. La part fixe (R2) est soumise à une
        TVA réduite à 5,5 % pour tous les réseaux de chaleur.
      </Highlight>
      <Subtitle>Les certificats d’économies d’énergie (CEE)</Subtitle>
      Le dispositif des CEE repose sur une obligation de réalisation d’économies
      d’énergie imposée par les pouvoirs publics aux fournisseurs d’énergie (les
      "obligés"). Le dispositif fonctionne par périodes de trois ans, avec un
      objectif d’économie d’énergie fixée pour chaque période. Pour obtenir des
      CEE et atteindre les objectifs fixés, les obligés peuvent notamment
      financer un certain nombre d’opérations menées par les ménages, les
      collectivités territoriales ou les professionnels. Des fiches d’opérations
      standardisées permettent, pour les opérations d’économies d’énergie les
      plus courantes, de préciser les conditions d’éligibilité et les modalités
      d’évaluation des économies d’énergie. Parmi ces fiches, plusieurs
      concernent les réseaux de chaleur : fiches RES-CH-101 à 108, fiche
      BAT-TH-127 et BAT-TH-137.
      <br />
      <br />
      La principale aide mobilisable au titre des CEE par les propriétaires et
      gestionnaires de bâtiments résidentiels collectifs et tertiaires lors d’un
      raccordement à un réseau de chaleur est le « Coup de pouce chauffage des
      bâtiments résidentiels collectifs et tertiaires ». <br />
      <br />
      Pour en savoir plus :{' '}
      <a
        href="https://www.ecologie.gouv.fr/operations-standardisees-deconomies-denergie"
        target="_blank"
        rel="noreferrer"
      >
        https://www.ecologie.gouv.fr/operations-standardisees-deconomies-denergie
      </a>
    </>
  );
};

export default State;
