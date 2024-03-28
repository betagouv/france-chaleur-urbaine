import { Highlight } from '@codegouvfr/react-dsfr';
import { Source, Subtitle } from './Contents.styles';

const Actors = () => {
  return (
    <>
      <Subtitle> Collectivités et opérateurs</Subtitle>
      <b>
        Les réseaux de chaleur sont majoritairement établis à l’initiative de
        collectivités territoriales
      </b>
      {' '}: le chauffage urbain mis en place est alors qualifié de service
      public. Ce sont les communes qui sont compétentes pour la création et
      l’exploitation des réseaux de chaleur, toutefois elles peuvent transférer
      cette compétence à un groupement de collectivités (intercommunalité,
      syndicat, ...), ou à une collectivité d’échelle supérieure.
      <br />
      <br />
      Dans tous les cas, il s’agit d’une compétence optionnelle des
      collectivités, c’est-à-dire qu’elles n’ont aucune obligation de créer un
      réseau de chaleur sur leur territoire. Il s’agit également d’une
      compétence non exclusive : des réseaux peuvent être créés par d’autres
      acteurs, y compris des acteurs privés.
      <br />
      <br />
      <Highlight>
        <b>
          La collectivité (ou groupement de collectivités) peut par ailleurs
          déléguer une part plus ou moins grande de ses responsabilités à un
          opérateur (aussi qualifié d’exploitant)
        </b>
        . Elle reste toutefois responsable du contrôle du service assuré par
        l’opérateur. Ainsi, si l’opérateur a pris des engagements sur les tarifs
        de la chaleur ou sur la proportion d’énergies renouvelables utilisées
        (par exemple), il appartient à la collectivité de s’assurer qu’ils sont
        bien respectés.
      </Highlight>
      La majorité des réseaux de taille importante sont ainsi concédés par les
      collectivités à des opérateurs, via des délégations de service public. La
      gestion du réseau en régie par la collectivité suppose en effet qu’elle
      dispose au sein de ses services de moyens techniques et humains qui lui
      permettent d’assurer le fonctionnement et l’entretien des installations.
      <Source>
        Source : CEREMA{' '}
        <a
          href="https://reseaux-chaleur.cerema.fr/espace-documentaire/cadre-dintervention-des-collectivites-en-matiere-reseaux-chaleur"
          target="_blank"
          rel="noreferrer"
        >
          https://reseaux-chaleur.cerema.fr/espace-documentaire/cadre-dintervention-des-collectivites-en-matiere-reseaux-chaleur
        </a>
      </Source>
      <br />
      <br />
      <Subtitle>Les syndicats, fédérations et associations d’acteurs</Subtitle>
      <b>
        Le SNCU, Syndicat national du chauffage urbain et de la climatisation
        urbaine
      </b>
      , regroupe des gestionnaires publics et privés de réseaux de chaleur et de
      froid. Ses adhérents sont en charge de plus de 90 % de l’activité du
      secteur. Le SNCU est membre de la Fédération des services énergie
      environnement (FEDENE). Il a pour mission la promotion des réseaux de
      chaleur et de froid ainsi que le développement et la représentation des
      intérêts de la profession auprès des décideurs, des acteurs
      institutionnels et des parties prenantes. Le SNCU réalise une enquête
      annuelle sur les réseaux de chaleur et de froid pour le compte du
      ministère de la transition écologique, à caractère obligatoire pour les
      gestionnaires des réseaux.
      <br />
      <br />
      <b>Amorce</b> est une association qui vise à informer et accompagner les
      collectivités et acteurs locaux en matière de transition énergétique, de
      gestion territoriale des déchets et de gestion durable de l'eau. Elle
      rassemble plus de 1000 adhérents, dont deux tiers de collectivités. Amorce
      est un acteur historique des réseaux de chaleur, qui réalise notamment
      chaque année une analyse du prix de vente moyen des réseaux de chaleur et
      de froid, en s’appuyant sur les résultats de l’enquête commanditée par le
      ministère de la transition écologique et pilotée par le SNCU.
      <br />
      <br />
      <b>ViaSeva</b> est une association créée en novembre 2000, avec pour
      mission de faire découvrir au grand public le fonctionnement et les
      avantages des réseaux de chaleur et de froid, aussi bien sur le plan de
      leurs performances énergétiques et du prix, que de leur impact positif sur
      l’environnement. L’association regroupe des gestionnaires de réseaux,
      collectivités, organismes publics… ViaSeva dispose notamment d’un portail
      cartographique regroupant les tracés de réseaux de chaleur et de froid.
      <br />
      <br />
      <b>
        La FNCCR, Fédération nationale des collectivités concédantes et régies
      </b>
      , est une association de collectivités territoriales spécialisée dans les
      services publics locaux en réseau, notamment dans le domaine de l’énergie.
      La FNCCR promeut la maîtrise des consommations et l’utilisation des
      énergies renouvelables. Elle sensibilise et accompagne les collectivités,
      en particulier dans la prise en compte des nouvelles exigences
      réglementaires. La FNCCR est partenaire de France Chaleur Urbaine depuis
      l’origine du projet.
    </>
  );
};

export default Actors;
