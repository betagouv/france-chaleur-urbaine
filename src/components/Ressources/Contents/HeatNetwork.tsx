import Infographie from '@components/Infographie';
import TrackedVideo from '@components/TrackedVideo/TrackedVideo';
import Link from 'next/link';
import { MutableRefObject } from 'react';
import { Subtitle } from './Contents.styles';
import { Container, WithImage, WithVideo } from './DistrictHeating.styles';

const HeatNetwork = ({
  reseauDeChaleurRef,
  energiesRef,
  developpementRef,
  caracteristiquesRef,
  loiRef,
  avantagesRef,
  acteursRef,
  raccordablesRef,
  obligationsRef,
  accompagnementRef,
  chaleurRef,
  aidesRef,
  subventionRef,
}: {
  reseauDeChaleurRef: MutableRefObject<HTMLHeadingElement | null>;
  energiesRef: MutableRefObject<HTMLHeadingElement | null>;
  developpementRef: MutableRefObject<HTMLHeadingElement | null>;
  caracteristiquesRef: MutableRefObject<HTMLHeadingElement | null>;
  loiRef: MutableRefObject<HTMLHeadingElement | null>;
  avantagesRef: MutableRefObject<HTMLHeadingElement | null>;
  acteursRef: MutableRefObject<HTMLHeadingElement | null>;
  raccordablesRef: MutableRefObject<HTMLHeadingElement | null>;
  obligationsRef: MutableRefObject<HTMLHeadingElement | null>;
  accompagnementRef: MutableRefObject<HTMLHeadingElement | null>;
  chaleurRef: MutableRefObject<HTMLHeadingElement | null>;
  aidesRef: MutableRefObject<HTMLHeadingElement | null>;
  subventionRef: MutableRefObject<HTMLHeadingElement | null>;
}) => {
  return (
    <Container>
      <Subtitle ref={reseauDeChaleurRef}>
        Qu’est-ce qu’un réseau de chaleur ?
      </Subtitle>
      <WithVideo>
        <div>
          Un <b>réseau de chaleur</b> est constitué <b>de canalisations</b> qui
          transportent vers un ensemble de bâtiments de la{' '}
          <b>
            chaleur produite localement, à partir d’énergies renouvelables ou de
            récupération.
          </b>
          <br />
          <br />
          Tout réseau de chaleur est constitué des éléments suivants :
          <br />
          <br />
          <ul>
            <li>
              <b>
                une unité de production de chaleur, qui peut notamment exploiter
                des{' '}
                <Link href="/ressources/energies-verte#contenu">
                  énergies renouvelables et de récupération
                </Link>{' '}
                locales ;
              </b>
            </li>
            <br />
            <li>
              <b>un réseau « primaire »</b>, composé de tuyaux qui acheminent la
              chaleur sous forme d’un fluide caloporteur. Le fluide est en
              général de l’eau chaude, plus rarement de la vapeur d’eau. Ce
              réseau primaire comprend un circuit aller et un circuit retour. Le
              circuit aller transporte le fluide chaud issu de l’unité de
              production vers les bâtiments. Le circuit retour rapporte le
              fluide refroidi vers la chaufferie centrale, où il est réchauffé
              et renvoyé dans le réseau ;
            </li>
            <br />
            <li>
              <b>les sous-stations d’échange</b>, situées en bas d’immeuble, qui
              transfèrent la chaleur du réseau primaire vers un réseau «
              secondaire ». La sous-station comprend en général un échangeur
              ainsi qu’un compteur de la chaleur transférée, qui permet de
              connaître la consommation d’énergie du bâtiment (nécessaire pour
              la facturation). Le réseau secondaire, qui transporte la chaleur
              au sein de l’immeuble, depuis la sous-station jusque dans les
              logements, est sous la responsabilité du gestionnaire du bâtiment.
              Il ne fait pas partie du réseau de chaleur à proprement parler.{' '}
            </li>
          </ul>
        </div>
        <div>
          <TrackedVideo
            width="100%"
            poster="/img/rcu-illustation.svg"
            src="/videos/FCU-RC.mp4"
          />
        </div>
      </WithVideo>
      <br />
      <b>La création d’un réseau de chaleur</b> n’est pertinente que dès lors
      qu’une concentration suffisamment dense de bâtiments et besoins en chaleur
      existe. Les réseaux de chaleur sont donc surtout développés en milieu
      urbain, c’est pourquoi on parle également de « chauffage urbain ».
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={energiesRef}>
        Quelles énergies alimentent les réseaux de chaleur ?
      </Subtitle>
      <WithImage>
        <div>
          En 2021, les{' '}
          <b>
            réseaux de chaleur sont alimentés en moyenne à 62,6 % par des{' '}
            <Link href="/ressources/energies-verte#contenu">
              énergies renouvelables et de récupération
            </Link>
          </b>
          . Les principales sources d’énergies renouvelables et de récupération
          exploitées sont :
          <br />
          <br />
          <ul>
            <li>
              la{' '}
              <b>
                récupération de la chaleur issue de l’incinération des ordures
                ménagères
              </b>
              , qui représente 26,9 % du mix énergétique des réseaux. On
              qualifie d’unités de valorisation énergétique les sites dont la
              chaleur est récupérée ;
            </li>
            <br />
            <li>
              la <b>combustion de la biomasse</b>, qui représente 23,9 % du mix
              énergétique des réseaux de chaleur. Il s’agit principalement de
              bois (biomasse forestière, sous-produits de l’industrie du bois,
              déchets), et dans une moindre mesure de biomasse agricole (résidus
              de récolte et déchets des industries agroalimentaires, cultures
              énergétiques) et de déchets organiques ;
            </li>
            <br />
            <li>
              la <b>géothermie</b>, c’est-à-dire la chaleur extraite du
              sous-sol. Les réseaux de chaleur sont l’unique moyen de valoriser
              la chaleur profonde (extraite à des profondeurs de plus de 200 m).
              La géothermie représente 5,5 % du mix énergétique des réseaux de
              chaleur.
            </li>
          </ul>
        </div>
        <Infographie
          src="/img/FCU_Infographie_Enrr.jpg"
          alt="Les énergies renouvelables et de récupération"
        />
      </WithImage>
      <br />
      En 2021, les réseaux de chaleur restent encore alimentés à 35,5 % par du
      gaz, un pourcentage qui décroît cependant d’année en année. Le gaz est le
      plus souvent utilisé en appoint pendant les heures de pointe, ou en
      remplacement des énergies renouvelables lorsque cela est nécessaire.
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={developpementRef}>
        Quand et comment les réseaux de chaleur se sont-ils développés en
        France ?
      </Subtitle>
      Les{' '}
      <b>
        premiers réseaux de chaleur ont été{' '}
        <Link href="/ressources/histoire#contenu">
          créés au début du vingtième siècle
        </Link>{' '}
        dans quelques grandes villes, dont les besoins en chaleur étaient
        importants et où ce mode de chauffage apparaissait comme une solution
        idéale pour lutter contre les inconvénients du chauffage individuel au
        charbon ou au bois
      </b>{' '}
      (nuisances liées à l’approvisionnement, pollution, incendies…).
      <br />
      <br />
      Sur Paris, l’activité de la Compagnie Parisienne de Chauffage Urbain
      débute ainsi en 1927. Le réseau de chaleur alimente initialement les
      grandes structures : gare de Lyon, grands magasins, monuments
      prestigieux...
      <br />
      <br />
      Entre les années 1950 et 1970,{' '}
      <b>
        l’urbanisation est forte en France et le déploiement des réseaux de
        chaleur accompagne celui de nouvelles zones d’habitation
      </b>
      . Les réseaux de chaleur sont alors généralement alimentés par du fioul ou
      du charbon.
      <br />
      <br />
      <b>
        Les chocs pétroliers de 1973 et 1981 amènent les pouvoirs publics à
        chercher une diversification du mix énergétique national
      </b>
      . Les pistes explorées en s’appuyant sur des réseaux de chaleur sont le
      recours à la géothermie profonde (au Dogger) et la chaleur issue de
      l’incinération des ordures ménagères, notamment en Île-de-France, où la
      ressource est disponible et la densité de construction élevée. De nouveaux
      réseaux de chaleur font appel à ces sources de chaleur, d’anciens réseaux
      modifient leur mix énergétique. La compétence des collectivités en matière
      d’établissement de réseaux de chaleur est consacrée dans la loi chaleur du
      15 juillet 1980.
      <br />
      <br />
      <b>
        Le contre-choc pétrolier de 1986 se conjugue à une vague de libéralisme
        et le sujet énergie devient moins prioritaire
      </b>
      . Le baril de pétrole s’effondre puis va demeurer dans une fourchette de
      bas prix (entre 15 à 25 $/baril) pendant presque une vingtaine d’années.
      C’est le coup d’arrêt des investissements dans les énergies renouvelables
      qui ne sont plus rentables par rapport au fioul ou au gaz dont les prix
      sont indexés sur ceux du pétrole. Peu de nouveaux réseaux de chaleur sont
      mis en place, hormis de petits réseaux ruraux alimentés par la biomasse,
      dans le cadre de plans régionaux visant à développer le bois-énergie.
      <br />
      <br />
      <b>
        Il faut attendre 2005 avec la loi POPE (première loi de Programmation
        des Orientations de la Politique Énergétique) puis les lois Grenelle de
        2009 et 2010 pour que les réseaux de chaleur reconquièrent une place
        importante dans la politique énergétique nationale
      </b>
      . Il leur est confié la mission de se développer et de contribuer de façon
      importante à l’augmentation des énergies renouvelables dans le mix
      énergétique national.
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={caracteristiquesRef}>
        Quelles sont aujourd’hui les caractéristiques des réseaux de chaleur
        français ?
      </Subtitle>
      L’
      <b>
        <a
          href="https://www.fedene.fr/lenquete-annuelle-des-reseaux-de-chaleur-et-de-froid/"
          target="_blank"
          rel="noreferrer"
        >
          enquête annuelle des réseaux de chaleur et de froid
        </a>
      </b>{' '}
      réalisée par le Syndicat national du chauffage urbain, avec le concours de
      l’association Amorce et sous tutelle du ministère de la transition
      énergétique, recense{' '}
      <b>898 réseaux de chaleur en 2021. 6529 km de réseaux</b> alimentent ainsi
      <b>44 945 bâtiments</b>, avec un total de chaleur livrée en 2021 qui
      s’élève à <b>29,8 TWh</b>. Grâce à un{' '}
      <b>taux d’énergies renouvelables et de récupération de 62,6 %</b>, les
      réseaux de chaleur français ont un{' '}
      <b>contenu carbone moyen en analyse du cycle de vie de 125 eqCO2/kWh</b>{' '}
      seulement, un contenu qui a été divisé de près de moitié en 10 ans. En
      2021, ils ont ainsi permis d’éviter l’émission de plus de 6,63 tonnes de
      CO2 (par rapport à des chaudières individuelles gaz), soit l’équivalent de
      11,6 millions d’aller-retours Paris-New York (source : SNCU).
      <br />
      <br />
      43 % de la consommation énergétique de la France est consacrée à la
      chaleur.{' '}
      <b>
        Les réseaux de chaleur n’en couvrent encore qu’une faible part, de
        l’ordre de 5%
      </b>
      . La France se positionne ainsi en 19ème place comparée à ses voisins
      européens. En revanche, le mix énergétique des réseaux de chaleur français
      est plus vertueux que la moyenne européenne. En 2018, on comptait 58 %
      d’énergies renouvelables et de récupération dans les réseaux de chaleur
      français, contre une moyenne européenne de 33 %.
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={loiRef}>
        Quels objectifs la loi fixe-t-elle pour le développement des réseaux de
        chaleur ?
      </Subtitle>
      Promulguée en 2015, la loi relative à la transition énergétique pour la
      croissance verte (LTECV) a inscrit un objectif de 32 % d’énergies
      renouvelables dans la consommation finale d’ici 2030, dont 38 % pour la
      consommation finale de chaleur.{' '}
      <b>
        La quantité de chaleur et de froid renouvelable véhiculée par les
        réseaux devra alors être multipliée par 5 par rapport à l’année de
        référence 2012.
      </b>
      <br />
      <br />
      Pour y parvenir, la Programmation Pluriannuelle de l’Énergie (PPE) a
      défini pour objectif une quantité de chaleur renouvelable et de
      récupération de 24,4 TWh en 2023 et entre 31 et 36 TWh en 2028. En 2021,
      cette quantité s’élève à 18,6 TWh (source : SNCU).
      <br />
      <br />
      L’atteinte des objectifs fixés par la loi passera par :
      <ul>
        <li>
          la « <b>densification</b> » des réseaux de chaleur existants,
          c’est-à-dire la multiplication des raccordements sur ces réseaux ;
        </li>
        <li>
          l’<b>extension</b> des réseaux de chaleur existants ;
        </li>
        <li>
          le « <b>verdissement</b> » des réseaux de chaleur existants,
          c’est-à-dire l’augmentation de la part d’énergies renouvelables et de
          récupération qui les alimente (en remplacement des énergies fossiles)
           ;
        </li>
        <li>
          la <b>création de nouveaux réseaux de chaleur</b>, dès lors qu’elle
          est techniquement et économiquement possible.
        </li>
      </ul>
      <br />
      Le schéma directeur national des réseaux de chaleur réalisé par ViaSèva et
      Manergy en partenariat avec le SNCU et avec le soutien de l’ADEME
      identifie{' '}
      <b>
        1600 réseaux de chaleur à créer ou étendre partout en France d’ici 2030
      </b>
      , et un <b>taux d’énergies renouvelables et de récupération de 73 %</b> à
      atteindre à cet horizon.
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={avantagesRef}>
        Quels sont les avantages des réseaux de chaleur ?
      </Subtitle>
      Les réseaux de chaleur présentent des{' '}
      <b>
        <Link href="/ressources/avantages#contenu">
          atouts de différentes natures
        </Link>
      </b>
      , comparativement aux autres modes de chauffage (gaz, fioul,
      électricité...). Grâce à l’exploitation d’énergies renouvelables et de
      récupération locales, ils offrent :
      <br />
      <br />
      <WithImage>
        <div>
          <ul>
            <li>
              une{' '}
              <b>
                contribution à la lutte contre le changement climatique, avec
                des émissions de gaz à effet de serre réduites de plus de moitié
              </b>{' '}
              par rapport à un chauffage purement fossile (gaz ou fioul). À
              noter que le raccordement à un réseau de chaleur permet ainsi
              d’améliorer l’étiquette DPE d’un logement ;
            </li>
            <br />
            <li>
              un <b>impact positif pour la qualité de l’air</b>, avec des
              émissions de particules fines limitées, 18 fois moins importantes
              qu’avec un chauffage au fioul ;
            </li>
            <br />
            <li>
              un <b>chauffage fiable</b>, avec la suppression des chaudières en
              bas d’immeuble et des risques et nuisances associées, et la
              garantie d’un service public ;
            </li>
            <br />
            <li>
              des <b>tarifs compétitifs</b> : l’enquête annuelle sur le prix de
              la chaleur réalisée par l’association Amorce montre que{' '}
              <b>
                les réseaux de chaleur sont le mode de chauffage le moins cher
                pour les logements collectifs et les bâtiments tertiaires
              </b>
              . En 2021, la facture annuelle pour un logement moyen en habitat
              collectif (copropriété) s’élève à 1036 € pour un logement raccordé
              à un réseau de chaleur, contre 1200 € pour un chauffage au gaz
              collectif et 1843 € pour un chauffage au fioul collectif ! Les
              réseaux de chaleur alimentés à plus de 50 % par des énergies
              renouvelables bénéficient d’un taux de TVA réduit à 5,5 % sur
              l’ensemble de la facture, c’est-à-dire le plus bas du marché ;
            </li>
          </ul>
        </div>
        <Infographie
          src="/img/FCU_Infographie_Avenir.jpg"
          alt="Une solution d'avenir"
        />
      </WithImage>
      <br />
      <ul>
        <li>
          des{' '}
          <b>tarifs stables, peu sensibles aux fluctuations géopolitiques</b>.
          Entre 2015 et 2021, le coût de la chaleur livrée par les réseaux a
          augmenté en moyenne de 5 % seulement, contre 26 % pour l’électricité,
          29 % pour le gaz et 71 % pour le fioul (source : Amorce) ;
        </li>
        <br />
        <li>
          <b>une source d’emploi locale</b> : la création, le développement et
          l’exploitation d’un réseau de chaleur génère des emplois locaux, non
          délocalisables. Aujourd’hui, la filière recrute pour répondre au
          regain d’intérêt pour ce mode de chauffage écologique et économique.
          Les 1600 réseaux de chaleur à créer ou étendre d’ici 2030 représentent
          ainsi la création de 14 000 emplois non délocalisables (source :
          SNCU).
        </li>
      </ul>
      <br />
      Le raccordement aux réseaux de chaleur est ainsi encouragé par la
      réglementation (instauration d’une obligation de raccordement autour des
      réseaux classés, réponse aux exigences environnementales de la RE2020,
      coefficients incitatifs dans le cadre du dispositif éco-énergie
      tertiaire…).
      <br />
      <br />
      Ils témoignent :
      <TrackedVideo
        width="100%"
        src="/videos/FCU-accueil.mp4"
        poster="/videos/FCU-accueil.jpg"
      />
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={acteursRef}>
        Quels sont les acteurs en charge des réseaux de chaleur ?
      </Subtitle>
      Les réseaux de chaleur sont le plus souvent créés{' '}
      <b>
        à l’
        <Link href="/ressources/acteurs#contenu">
          initiative de collectivités
        </Link>{' '}
        (commune, intercommunalité)
      </b>{' '}
       : on parle alors de service public de chauffage urbain. Les collectivités
      n’ont cependant pas l’obligation d’équiper leur territoire d’un réseau de
      chaleur. Par ailleurs, des réseaux de chaleur peuvent également être créés
      par d’autres acteurs, notamment des acteurs privés.
      <br />
      <br />
      Dans le cas le plus fréquent de service public de chauffage urbain, la
      collectivité (ou groupement de collectivités) est responsable du bon
      fonctionnement du service. Elle peut toutefois{' '}
      <b>
        déléguer une part plus ou moins importante de ses responsabilités à un
        opérateur
      </b>{' '}
      (par exemple Engie, Dalkia, Idex, Coriance, ou tout autre). La
      collectivité reste cependant responsable du contrôle du service assuré par
      l’opérateur : elle veille notamment à ce que l’opérateur respecte les
      engagements qu’il a pris sur les tarifs de la chaleur ou encore sur la
      proportion d’énergies renouvelables utilisées.
      <br />
      <br />
      <b>
        La majorité des réseaux de chaleur de taille importante sont ainsi
        concédés par les collectivités à des opérateurs, via des délégations de
        service public
      </b>
      . La gestion du réseau en régie par la collectivité suppose qu’elle
      dispose au sein de ses services de moyens techniques et humains suffisants
      pour assurer le fonctionnement et l’entretien des installations. Au total,
      80 % de la chaleur livrée par les réseaux au niveau national est issue de
      réseaux concédés.
      <br />
      <br />
      Du fait de la diversité des modes de gestion et de la multitude d’acteurs
      impliqués dans la filière (communes, intercommunalités, syndicats
      d’énergie, opérateurs…), il peut être difficile de savoir à qui s’adresser
      pour se raccorder à un réseau de chaleur.{' '}
      <b>
        L’un des objectifs de France Chaleur Urbaine est de simplifier l’accès à
        l’information, et d’assurer la mise en relation entre toute personne
        intéressée pour raccorder son bâtiment et le gestionnaire du réseau de
        chaleur le plus proche.
      </b>
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={raccordablesRef}>
        Tous les bâtiments sont-ils raccordables à un réseau de chaleur ?
      </Subtitle>
      La possibilité de se raccorder à un réseau de chaleur dépend de{' '}
      <Link href="/ressources/faisabilite#contenu">plusieurs critères</Link>, et
      notamment des suivants :
      <br />
      <br />
      <ul>
        <li>
          <b>la proximité à un réseau de chaleur :</b>
        </li>
      </ul>
      La couverture du territoire national par les réseaux de chaleur reste
      hétérogène, même si les principales villes sont désormais équipées d’un
      réseau. Pour pouvoir se raccorder, il est indispensable d’être{' '}
      <b>situé à proximité de l’un des 898 réseaux de chaleur français</b>. Il
      n’existe pas de seuil de distance exact à respecter pour être raccordable.
      Celui-ci dépendra du niveau de consommation énergétique du bâtiment à
      raccorder, mais aussi de chaque réseau, selon ses caractéristiques
      techniques. France Chaleur Urbaine considère qu’un bâtiment a de fortes
      chances d’être raccordable s’il est situé à moins de 100 m d’un réseau de
      chaleur. Pour des distances comprises entre 100 et 200 m, le raccordement
      reste envisageable. Dans tous les cas, le gestionnaire du réseau de
      chaleur sera le seul à pouvoir confirmer si le raccordement est possible
      ou non, en fonction des caractéristiques du bâtiment et de celles du
      réseau.
      <br />
      <br />
      <ul>
        <li>
          <b>le type de bâtiment</b>
        </li>
      </ul>
      Dans le cas de{' '}
      <b>
        bâtiments résidentiels collectifs (copropriété, logement social…) et
        tertiaires d’une taille suffisante
      </b>
      , les coûts fixes liés au raccordement vont pouvoir être mutualisés, et
      donc plus facilement amortis. Le raccordement des maisons individuelles
      reste possible dans certains cas, mais il est plus rare. La sous-station
      dessert alors souvent un groupe de maisons (lotissement par exemple).
      <br />
      <br />
      <ul>
        <li>
          <b>le chauffage actuel :</b>
        </li>
      </ul>
      Le raccordement à un réseau de chaleur est plus simple lorsque le{' '}
      <b>bâtiment est équipé d’un chauffage collectif au gaz ou fioul</b> : dans
      ce cas, il dispose déjà du réseau secondaire permettant le transport de la
      chaleur au sein de l’immeuble, et d’équipements adaptés dans les
      logements. Pour un bâtiment chauffé au gaz individuel, il sera nécessaire
      de créer le réseau secondaire au sein de l’immeuble, ce qui induit un coût
      et des travaux supplémentaires. Le cas le moins favorable est celui des
      bâtiments chauffés à l’électricité : pour ceux-là, il faudra non seulement
      équiper l’immeuble d’un réseau secondaire, mais également mettre en place
      des radiateurs adaptés dans les logements. Des travaux seront conséquents
      et coûteux seront donc à prévoir dans les parties communes mais aussi dans
      les logements. Ils ne s’envisagent souvent que dans le cadre d’une
      réhabilitation globale du bâtiment.
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={obligationsRef}>
        Certains bâtiments ont-ils l’obligation de se raccorder à un réseau de
        chaleur ?
      </Subtitle>
      <b>
        Les{' '}
        <Link href="/ressources/prioritaire#contenu">
          bâtiments situés dans le périmètre de développement prioritaire
        </Link>{' '}
        de réseaux de chaleur classés ont l’obligation de se raccorder au réseau
      </b>{' '}
      dans les cas suivants :
      <ul>
        <li>
          pour tout <b>bâtiment neuf</b> dont les besoins de chauffage sont
          supérieurs à une puissance de 30 kW ;
        </li>
        <li>
          pour tout <b>bâtiment renouvelant son installation de chauffage</b>{' '}
          au-dessus d’une puissance de 30 kW.
        </li>
      </ul>
      Le seuil de puissance peut être relevé par la collectivité.
      <br />
      <br />
      <WithImage>
        <div>
          Cette obligation entre dans le cadre du classement des réseaux de
          chaleur, rendu automatique par les lois Énergie Climat de 2019 et
          Climat et Résilience de 2021.{' '}
          <b>
            Les réseaux de chaleur de service publics sont automatiquement
            classés s’ils satisfont trois conditions
          </b>{' '}
           :
          <ul>
            <li>
              réseau alimenté à plus de 50 % par une énergie renouvelable ou de
              récupération ;
            </li>
            <li>
              comptage des quantités d’énergie livrées par point de livraison
              assuré ;
            </li>
            <li>
              équilibre <b>financier</b> de l’opération pendant la période
              d’amortissement des installations assuré au vu des besoins à
              satisfaire, de la pérennité de la ressource en énergie
              renouvelable ou de récupération, et compte tenu des conditions
              tarifaires prévisibles.
            </li>
          </ul>
          <br />
          L’
          <a
            href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000046821204"
            target="_blank"
            rel="noreferrer"
          >
            arrêté du 23 décembre 2022
          </a>{' '}
          relatif au classement des réseaux de chaleur et de froid recense{' '}
          <b>
            636 réseaux répondant à ces critères. La cartographie France Chaleur
            Urbaine permet de visualiser les réseaux de chaleur concernés. Leur
            périmètre de développement prioritaire, zone dans laquelle
            s’applique l’obligation de raccordement, figure également sur la
            carte dès lors que la collectivité l’a transmis.
          </b>
        </div>
        <Infographie
          height={294}
          src="/img/FCU_Infographie_Classement.jpg"
          alt="Classement des réseaux de chaleur"
        />
      </WithImage>
      <br />
      <b>
        C’est la collectivité qui définit le périmètre de développement
        prioritaire de son réseau, par délibération
      </b>
      . Si ce périmètre n’est pas défini avant le 1er juillet 2023, un périmètre
      par défaut s’appliquera (périmètre du contrat de concession, ou en
      l’absence de concession au périmètre du territoire de la ou des communes
      desservies par le réseau).
      <br />
      <br />À noter que les collectivités ont la possibilité de délibérer pour
      s’opposer au classement, si ce refus est justifié.
      <br />
      <br />
      <b>
        Les bâtiments concernés par l’obligation de raccordement peuvent
        également solliciter une dérogation auprès de la collectivité, s’ils ne
        souhaitent pas se raccorder.
      </b>{' '}
      Les motifs possibles de dérogation sont au nombre de quatre :
      <ul>
        <li>
          le demandeur justifie de l’incompatibilité des caractéristiques
          techniques de l’installation qui présente un besoin de chaleur ou de
          froid avec celles offertes par le réseau ;
        </li>
        <li>
          l’installation ne peut être alimentée en énergie par le réseau dans
          les délais nécessaires à la satisfaction des besoins de chauffage,
          d’eau chaude sanitaire ou de climatisation de l’usager, sauf si
          l’exploitant du réseau justifie de la mise en place d’une solution
          transitoire de nature à permettre l’alimentation des usagers en
          chaleur ou en froid ;
        </li>
        <li>
          le demandeur justifie de la mise en œuvre, pour la satisfaction de ses
          besoins de chauffage, d’eau chaude sanitaire ou de climatisation,
          d’une solution alternative alimentée par des énergies renouvelables et
          de récupération à un taux équivalent ou supérieur à celui du réseau
          classé suivant les modalités de calcul définies par l’arrêté du
          ministre chargé de l’énergie mentionné au I de l’article R. 712-1 ;
        </li>
        <li>
          le demandeur justifie de la disproportion manifeste du coût du
          raccordement et d’utilisation du réseau par rapport à d’autres
          solutions de chauffage et de refroidissement.
        </li>
      </ul>
      <br />
      <br />
      <br />
      <Subtitle ref={accompagnementRef}>
        À qui m’adresser pour être accompagné dans mon projet de raccordement ?
      </Subtitle>
      Avant d’envisager de changer son mode de chauffage,{' '}
      <b>il est nécessaire de s’interroger sur l’isolation du bâtiment</b> :
      pour réduire les émissions de gaz à effet de serre d’un bâtiment et la
      facture associée à son chauffage, le premier réflexe à avoir est celui de
      la <b>rénovation thermique</b>. Il est préférable de procéder aux travaux
      d’isolation avant de souscrire un contrat pour une puissance de chauffe
      donnée, qui pourrait devenir surestimée après la rénovation. Le service
      public de la rénovation de l’habitat <b>France Rénov’</b> vous guide dans
      vos projets. Les informations et conseils délivrés par France Rénov’ sont
      neutres, gratuits et personnalisés. Sont mis à votre disposition dans le
      cadre de ce service :
      <br />
      <br />
      <ul>
        <li>
          une{' '}
          <b>
            <a
              href="https://france-renov.gouv.fr"
              target="_blank"
              rel="noreferrer"
            >
              plateforme web
            </a>
          </b>{' '}
          proposant des informations sur la rénovation de l’habitat, un outil de
          simulation pour identifier les aides financières disponibles pour la
          rénovation énergétique de son logement, ainsi qu’un annuaire des
          artisans qualifiés reconnus garants de l’environnement (RGE) ;
        </li>
        <br />
        <li>
          un numéro de téléphone national (0 808 800 700) pour joindre les
          conseillers France Rénov’ ;
        </li>
        <br />
        <li>
          un réseau de guichets Espaces conseil France Rénov’, répartis sur
          l’ensemble du territoire, pour informer et conseiller les ménages.
        </li>
      </ul>
      <br />
      Un interlocuteur de confiance « Mon accompagnateur Rénov’ » pourra vous
      accompagner durant tout votre projet.
      <br />
      <br />
      Concernant plus spécifiquement le{' '}
      <b>raccordement à un réseau de chaleur</b>, vous trouverez un{' '}
      <b>grand nombre d’informations pratiques sur France Chaleur Urbaine</b>.
      Le service vous permet de{' '}
      <b>
        vérifier si un réseau de chaleur passe près de votre adresse, et vous
        met en relation avec le gestionnaire du réseau le plus proche.
      </b>
      <br />
      <br />
      <b>
        Les gestionnaires des réseaux de chaleur sont les seuls à pouvoir
        réaliser une étude de faisabilité pour un raccordement et à fournir un
        devis.
      </b>
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={chaleurRef}>
        Comment la chaleur fournie par un réseau est-elle facturée à l’abonné ?
      </Subtitle>
      Dans le cas d’un immeuble collectif, le client direct (abonné) du réseau
      de chaleur sera le gestionnaire du bâtiment (syndic de copro, bailleur…).
      C’est lui qui paye la facture et récupère les sommes dues auprès des
      usagers (copropriétaires, locataires…).
      <br />
      <br />
      La facture envoyée aux abonnés se décompose en deux parties :
      <ul>
        <li>
          <b>une part variable R1</b>, égale à la consommation de l’abonné
          multipliée par le prix de la chaleur en €/MWh. Le prix de la chaleur
          dépendra des sources d’énergie utilisées et du rendement du réseau.
        </li>
        <li>
          <b>une part fixe R2, ou abonnement</b>, fonction de la puissance
          souscrite et qui recouvre :
          <ul>
            <li>
              les charges d’électricité pour assurer la production et la
              distribution de la chaleur ;
            </li>
            <li>
              les charges de conduite et petit entretien des installations ;
            </li>
            <li>
              les charges de gros entretien et de renouvellement des
              installations ;
            </li>
            <li>
              les charges de financement (remboursement de l’emprunt) de la
              création et l’installation initiale du réseau de chaleur.
            </li>
          </ul>
        </li>
      </ul>
      <br />
      <b>
        Le poids relatif de ces deux parts est très variable d’un réseau de
        chaleur à l’autre
      </b>
      . Chacune peut représenter 30 à 70 % de la facture. Cette variabilité
      reflète la diversité des sources de chaleur utilisées. À titre d’exemple,
      pour un réseau alimenté par de la géothermie, la part d’achat de
      combustible sera très faible voire nulle : le gros de la dépense réside
      dans le forage (financement de la création de l’installation), et donc
      dans le terme R2. Au contraire, la part R1 sera plus importante pour un
      réseau achetant de la chaleur à une unité d’incinération des ordures
      ménagères.
      <br />
      <br />
      <b>
        La part fixe R2 est soumise à un taux de TVA réduit à 5.5 % pour tous
        les réseaux. Ce taux réduit s’applique également sur le terme R1 pour
        les réseaux alimentés à plus de 50 % par des énergies renouvelables et
        de récupération.
      </b>
      <br />
      <br />À la facture payée par l’abonné au gestionnaire du réseau de chaleur
      s’ajoutent les <b>coûts d’entretien du réseau secondaire</b>{' '}
      (canalisations acheminant la chaleur depuis la sous-station en bas
      d’immeuble jusque dans les logements).
      <br />
      <br />
      L’abonné (gestionnaire de l’immeuble) répartit le coût de la chaleur sur
      les usagers finaux (locataires, propriétaires). La loi impose que chaque
      usager ait une facture calculée sur la base de sa propre consommation,
      sauf cas de dérogation (lorsque cela est techniquement impossible en
      particulier).
      <br />
      <br />
      <br />
      <br />
      <Subtitle ref={aidesRef}>
        Quelles sont les aides financières mobilisables pour le raccordement
        d’un bâtiment à un réseau de chaleur ?
      </Subtitle>
      <ul>
        <li>
          <b>
            Le coup de pouce « Chauffage des bâtiments résidentiels collectifs
            et tertiaires »
          </b>
        </li>
      </ul>
      <br />
      Depuis le 1er septembre 2022,{' '}
      <b>
        le coup de pouce «{' '}
        <Link href="/ressources/aides#contenu">
          Chauffage des bâtiments résidentiels collectifs et tertiaires
        </Link>{' '}
         » permet de réduire significativement le coût du raccordement à un
        réseau de chaleur.
      </b>
      <br />
      <br />
      Cette prime est mise en place par l’État dans le cadre du dispositif des{' '}
      <b>certificats d’économie d’énergie</b>, avec pour objectif d’accélérer le
      remplacement des équipements de chauffage ou de production d’eau chaude
      sanitaire polluants par un raccordement à un réseau de chaleur alimenté à
      plus de 50 % par des énergies renouvelables et de récupération, ou à
      défaut par d’autres moyens de chauffage performants.
      <br />
      <br />
      Les modalités de calcul des montants du « Coup de pouce chauffage des
      bâtiments résidentiels collectifs et tertiaires » prennent en compte le
      fait que le raccordement des bâtiments de petite taille est confronté à
      des coûts fixes importants liés à des travaux de voirie (coûts
      indépendants du nombre de m2 ou du nombre de logements raccordés à un
      réseau de chaleur).
      <br />
      <br />
      L’aide est versée par les signataires de la charte « Coup de pouce
      chauffage des bâtiments résidentiels collectifs et tertiaires », dont la
      liste est accessible{' '}
      <a
        href="https://www.ecologie.gouv.fr/sites/default/files/CdP%20Chauffage%20B%C3%A2timents%20r%C3%A9sidentiels%20collectifs%20et%20tertiaires%20-%20Les%20offres%20Coup%20de%20pouce.pdf"
        target="_blank"
        rel="noreferrer"
      >
        ici
      </a>
      <br />
      <br />
      Son montant exact peut varier significativement d’un signataire à l’autre
       : il est donc indispensable de se rapprocher de plusieurs signataires et
      de comparer les offres proposées. Un simulateur est proposé sur France
      Chaleur Urbaine, qui fournit l’ordre de grandeur de la prime.
      <br />
      <br />
      Les <b>conditions d’attribution</b> sont les suivantes :
      <ul>
        <li>
          remplacement d’équipements de chauffage ou de production d’eau chaude
          sanitaire au charbon, au fioul ou au gaz au profit d’un raccordement à
          un réseau de chaleur alimenté majoritairement par des énergies
          renouvelables ou de récupération (ou, à défaut, en cas d’impossibilité
          technique ou économique du raccordement, de la mise en place
          d’équipements de chauffage ou de production d’eau chaude sanitaire ne
          consommant ni charbon ni fioul) ;
        </li>
        <li>
          bâtiments résidentiels collectifs et du secteur tertiaire existant
          depuis plus de deux ans à la date d’engagement de l’opération. ;
        </li>
        <li>
          opération valable pour une date d’engagement (signature du devis)
          comprise entre le 1er septembre 2022 et le 31 décembre 2025. Les
          travaux doivent être achevés au plus tard le 31 décembre 2026 ;
        </li>
        <li>
          le bénéficiaire ne peut prétendre pour une même opération qu’à une
          seule prime versée dans le cadre du dispositif des certificats
          d’économies d’énergie ;
        </li>
        <li>
          la facture devra expressément mentionner la dépose de l’équipement
          existant en indiquant l’énergie de chauffage (charbon, fioul ou gaz)
          et le type d’équipement déposé ;
        </li>
        <li>
          le raccordement d’un bâtiment déraccordé existant est éligible si et
          seulement si le déraccordement a eu lieu au moins 5 ans auparavant et
          que celui-ci n’a pas fait l’objet d’une demande de certificats
          d’économie d’énergie.
        </li>
      </ul>
      <br />
      <ul>
        <li>
          <b>Les aides à la rénovation globale </b>
        </li>
      </ul>
      <br />
      D’<Link href="/ressources/financement#contenu">autres aides</Link> peuvent
      être mobilisées pour les copropriétés qui se raccordent à un réseau de
      chaleur dans le cadre d’une rénovation globale :
      <br />
      <br />
      <ul>
        <li>
          <u>
            Le coup de pouce "rénovation performante de bâtiment résidentiel
            collectif"
          </u>{' '}
          peut être sollicité pour une rénovation globale avec un gain
          énergétique supérieur à 35 %. Le raccordement aux réseaux de chaleur
          alimentés majoritairement par des énergies renouvelables ou de
          récupération est alors obligatoire pour bénéficier de la prime,
          lorsque cette rénovation globale inclut le changement du mode de
          chauffage du bâtiment ;
        </li>
        <br />
        <li>
          <u>MaPrimeRénov’Copropriétés</u> peut être versée aux syndics des
          copropriétés pour les travaux effectués sur les parties communes,
          lorsque le raccordement s’inscrit dans des travaux de rénovation
          globale avec un gain énergétique supérieur à 35 % ;
        </li>
        <br />
        <li>
          <u>MaPrimeRénov’Sérénité</u> permet aux ménages aux revenus modestes
          et très modestes d’obtenir des financements plus avantageux pour leur
          rénovation globale afin de les encourager à réaliser des travaux les
          plus ambitieux possibles ;
        </li>
        <br />
        <li>
          <u>L’Éco-prêt à taux zéro "individuel"</u> est un prêt sans intérêt
          d’un montant maximal de 50 000 €, attribué sans condition de
          ressources par certaines banques pour financer des travaux
          d’amélioration de la performance énergétique, dont le raccordement à
          un réseau de chaleur ;
        </li>
        <br />
        <li>
          <u>L’Éco-prêt à taux zéro "copropriétés"</u> est un prêt collectif
          octroyé au syndicat des copropriétaires, pour le compte des
          copropriétaires qui souhaitent y participer. Comme l’éco-prêt à taux
          zéro « individuel », il permet de financer les travaux d’économie
          d’énergie des bâtiments de la copropriété et les éventuels frais
          induits par ces travaux.
        </li>
      </ul>
      <br />
      <br />
      <br />
      <Subtitle ref={subventionRef}>
        Quelles sont les subventions mobilisables pour la création d’un réseau
        de chaleur, son extension ou son verdissement ?
      </Subtitle>
      Le{' '}
      <b>
        Fonds chaleur, opéré par l’ADEME depuis 2009, permet de financer les
        installations de production de chaleur renouvelable et de récupération
        ainsi que les réseaux de chaleur liés à ces installations (projets
        portés par des collectivités et entreprises)
      </b>
      . L’objectif est de permettre à la chaleur renouvelable d’être compétitive
      par rapport à celle produite à partir d’énergies fossiles.{' '}
      <b>
        Depuis sa création en 2009, le Fonds Chaleur a permis de quasiment
        doubler la longueur des réseaux de chaleur en France, passant de 3450 km
        à près de 6200 km
      </b>
      .
      <br />
      <br />
      Le Fonds chaleur en quelques chiffres c’est :
      <ul>
        <li>
          2,9 milliards d’euros attribués sur 10,6 milliards d’euros investis
          entre 2009 et 2021 ;
        </li>
        <li>
          6566 opérations accompagnées et financées entre 2009 et 2021, dont
          1253 projets de réseaux de chaleur et de froid (création, extension…),
          829 installations géothermiques, 1853 chaufferies biomasse, 151
          projets de récupération de chaleur fatale ;
        </li>
        <li>
          un budget croissant : 250 M€ en 2018, 307 M€ en 2019, 350 M€ en 2020
          et 2021
        </li>
      </ul>
      <br />
      Le Fonds Chaleur comprend :
      <ul>
        <li>des aides à l’investissement ;</li>
        <li>
          des aides pour accompagner les porteurs dans leur réflexion et leur
          prise de décision : schéma directeur des réseaux de chaleur, études de
          faisabilité technico-économique, missions d’assistance à maîtrise
          d’ouvrage...
        </li>
      </ul>
      <br />
      <b>
        Pour en savoir plus :{' '}
        <a
          href="https://fondschaleur.ademe.fr/le-fonds-chaleur/"
          target="_blank"
          rel="noreferrer"
        >
          https://fondschaleur.ademe.fr/le-fonds-chaleur/
        </a>
      </b>
      <br />
      <br />
    </Container>
  );
};

export default HeatNetwork;
