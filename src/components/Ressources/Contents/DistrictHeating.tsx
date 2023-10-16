import Infographie from '@components/Infographie';
import TrackedVideo from '@components/TrackedVideo/TrackedVideo';
import Link from 'next/link';
import { MutableRefObject } from 'react';
import { Subtitle } from './Contents.styles';
import { Container, WithImage, WithVideo } from './DistrictHeating.styles';

const DistrictHeating = ({
  chauffageUrbainRef,
  avantagesRef,
  chargeRef,
  critereRef,
  obligationRef,
  accompagnementRef,
  aidesRef,
}: {
  chauffageUrbainRef: MutableRefObject<HTMLHeadingElement | null>;
  avantagesRef: MutableRefObject<HTMLHeadingElement | null>;
  chargeRef: MutableRefObject<HTMLHeadingElement | null>;
  critereRef: MutableRefObject<HTMLHeadingElement | null>;
  obligationRef: MutableRefObject<HTMLHeadingElement | null>;
  accompagnementRef: MutableRefObject<HTMLHeadingElement | null>;
  aidesRef: MutableRefObject<HTMLHeadingElement | null>;
}) => {
  return (
    <Container>
      <Subtitle ref={chauffageUrbainRef}>
        Qu’est-ce que le chauffage urbain ?
      </Subtitle>
      <WithVideo>
        <div>
          <b>Une installation de chauffage urbain</b>, aussi appelée{' '}
          <b>réseau de chaleur</b>, est constituée de{' '}
          <b>
            canalisations qui permettent d’acheminer vers un ensemble de
            bâtiments de la chaleur produite localement, à partir d’énergies
            renouvelables ou de récupération
          </b>
          . Ce mode de chauffage est principalement développé en milieu urbain,
          dès lors qu’une concentration suffisamment dense de bâtiments et
          besoins en chaleur existe.
          <br />
          <br />
          Concrètement, le réseau de chaleur comprend :
          <br />
          <br />
          <ul>
            <li>
              <b>une unité de production de chaleur :</b> il s’agit
              d’installations robustes et fiables, surveillées en permanence et
              entretenues par des professionnels. Elles exploitent{' '}
              <Link href="/ressources/energies-vertes#contenu">
                différents types d’énergie
              </Link>
              {' '}:{' '}
              <ul>
                <li>
                  des <b>énergies de récupération</b>, en particulier la chaleur
                  issue de l’incinération des ordures ménagères ;
                </li>
                <li>
                  des <b>énergies renouvelables</b> : combustion de la biomasse
                  dans une chaufferie collective, installation de géothermie
                  profonde pour extraire la chaleur du sous-sol…
                </li>
                <li>
                  des <b>énergies fossiles</b> telles le gaz ou le fioul, qui
                  sont le plus souvent utilisées <b>en renfort</b> pendant les
                  heures de pointe, ou en remplacement lorsque cela est
                  nécessaire.
                </li>
              </ul>
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
      <ul>
        <li>
          <b>un réseau de distribution dit « primaire » :</b> il est composé de
          canalisations qui transportent la chaleur sous forme d’un fluide
          caloporteur (eau chaude en général, plus rarement vapeur d’eau). Ce
          réseau comprend un circuit aller qui achemine vers les bâtiments le
          fluide chaud issu de l’unité de production, et un circuit retour qui
          rapporte le fluide refroidi vers la chaufferie centrale, où il est à
          nouveau réchauffé et renvoyé dans le circuit.
        </li>
        <br />
        <li>
          <b>les sous-stations d’échange :</b> situées en pied d’immeuble, elles
          permettent de transférer la chaleur du circuit primaire vers un réseau
          dit « secondaire », interne au bâtiment à chauffer. Le réseau
          secondaire est géré par le bâtiment et non par le gestionnaire du
          réseau de chaleur. La sous-station comprend généralement un échangeur
          ainsi qu’un compteur de la chaleur transférée, qui permet de connaître
          la consommation d’énergie du bâtiment (nécessaire pour la
          facturation).
        </li>
      </ul>
      <br />
      <br />
      <Subtitle ref={avantagesRef}>
        Quels sont les avantages du chauffage urbain ?
      </Subtitle>
      <WithImage>
        <div>
          Le chauffage urbain permet de mobiliser des énergies renouvelables et
          de récupération locales. Aujourd’hui, les réseaux de chaleur français
          sont alimentés à plus de 62 % par celles-ci, un pourcentage qui ne
          cesse d’augmenter. Le recours à ces énergies locales et décarbonées
          permet au chauffage urbain d’afficher des{' '}
          <Link href="/ressources/avantages#contenu">
            atouts de natures différentes
          </Link>
          {' '}:
          <ul>
            <br />
            <li>
              <b>Un mode de chauffage écologique et propre :</b> en moyenne, le
              chauffage urbain émet 2 fois moins de gaz à effet de serre qu’un
              chauffage purement fossile (gaz ou fioul), et contribue ainsi à la
              lutte contre le changement climatique. Le chauffage urbain a
              également un impact positif sur la qualité de l’air : il émet 18
              fois moins de particules fines qu’un chauffage au fioul !
            </li>
            <br />
            <li>
              <b>Un mode de chauffage économique :</b> la part d’énergies
              renouvelables et de récupération locales qui alimente les réseaux
              de chaleur leur permet d’afficher des tarifs beaucoup plus stables
              que ceux du gaz, du fioul ou de l’électricité, qui sont notamment
              soumis à des fluctuations en fonction du contexte géopolitique.
              Entre 2015 et 2021, le coût du chauffage urbain a augmenté en
              moyenne de 5 % seulement, contre 26 % pour l’électricité, 29 %
              pour le gaz et 71 % pour le fioul ! Le chauffage urbain offre
              également des tarifs compétitifs, grâce à un taux de TVA réduit à
              5.5 % sur l’ensemble de la facture pour tous les réseaux
              majoritairement alimentés par des énergies renouvelables et de
              récupération (taux le plus bas du marché). L’enquête annuelle sur
              le prix de la chaleur réalisée par l’association Amorce montre
              qu’il s’agit du mode de chauffage le plus économique pour les
              immeubles de logements collectifs et tertiaires, loin devant
              toutes les autres solutions de chauffage. Enfin, les aides
              financières mises en place récemment au titre du « Coup de pouce
              chauffage des bâtiments résidentiels collectifs et tertiaires »
              permettent de réduire significativement le coût des travaux pour
              le raccordement au chauffage urbain.
            </li>
          </ul>
        </div>
        <Infographie
          src="/img/FCU_Infographie_Avenir_small.jpg"
          alt="Une solution d'avenir"
        />
      </WithImage>
      <ul>
        <br />
        <li>
          <b>Un mode de chauffage fiable :</b> se raccorder à un réseau de
          chaleur permet de bénéficier de la garantie d’un service public pour
          son chauffage. Un autre avantage majeur est la suppression des
          chaudières en bas d’immeuble, et des risques et nuisances qui leur
          sont associés.
        </li>
        <br />
        <li>
          <b>Une source d’emploi locale :</b> la création, le développement et
          l’exploitation d’un réseau de chauffage urbain constituent une source
          d’emplois locaux, non délocalisables. Aujourd’hui, la filière recrute
          pour répondre au regain d’intérêt pour ce mode de chauffage écologique
          et économique.
        </li>
      </ul>
      <br />
      <br />
      <TrackedVideo
        width="100%"
        src="/videos/FCU-accueil.mp4"
        poster="/videos/FCU-accueil.jpg"
      />
      <br />
      <br />
      <Subtitle ref={chargeRef}>
        Qui est en charge du chauffage urbain ?
      </Subtitle>
      Les réseaux de chaleur sont le plus souvent créés{' '}
      <b>
        <Link href="/ressources/acteurs#contenu">
          à l’initiative de collectivités
        </Link>
      </b>
      , pour chauffer les bâtiments publics et privés de leur territoire. Il
      s’agit toutefois d’une compétence optionnelle : les collectivités n’ont
      aucune obligation d’équiper leur territoire du chauffage urbain. Il s’agit
      également d’une compétence non exclusive : des réseaux de chaleur peuvent
      être créés par d’autres acteurs, y compris des acteurs privés.
      <br />
      <br />
      La collectivité (ou groupement de collectivités) peut par ailleurs{' '}
      <b>
        déléguer une part plus ou moins grande de ses responsabilités à un
        opérateur
      </b>
      , aussi qualifié d’exploitant : Engie, Dalkia, Idex, Coriance, ou tout
      autre. La collectivité reste toutefois responsable du contrôle du service
      assuré par l’opérateur. Ainsi, si l’opérateur a pris des engagements sur
      les tarifs de la chaleur ou sur la proportion d’énergies renouvelables
      utilisées (par exemple), il appartient à la collectivité de s’assurer
      qu’ils sont bien respectés.
      <br />
      <br />
      La majorité des réseaux de chaleur de taille importante sont ainsi
      concédés par les collectivités à des opérateurs, via des délégations de
      service public. La gestion du réseau en régie par la collectivité suppose
      en effet qu’elle dispose au sein de ses services de moyens techniques et
      humains qui lui permettent d’assurer le fonctionnement et l’entretien des
      installations.
      <br />
      <br />
      Le fait qu’il existe différents modes de gestion et de nombreux acteurs
      impliqués peut rendre difficile l’accès à l’information.{' '}
      <b>
        Comment savoir si mon territoire est équipé du chauffage urbain et à qui
        m’adresser pour me raccorder ? C’est ce que vous propose France Chaleur
        Urbaine
      </b>
      , qui vous offre la possibilité de tester votre adresse et d’être mis en
      relation avec le gestionnaire du réseau de chaleur le plus proche.
      <br />
      <br />
      <br />
      <Subtitle ref={critereRef}>
        Quels critères faut-il satisfaire pour être raccordable ?
      </Subtitle>
      La{' '}
      <Link href="/ressources/faisabilite#contenu">
        faisabilité d’un raccordement
      </Link>{' '}
      au chauffage urbain dépend des critères suivants :
      <ul>
        <br />
        <li>
          <b>La distance au réseau :</b>
        </li>
      </ul>
      Pour se raccorder au chauffage urbain, il faut avant tout être{' '}
      <b>situé à proximité de l’un des 898 réseaux de chaleur français</b>. Il
      est difficile de définir un seuil de distance exact à respecter pour être
      raccordable. Celui-ci dépend du niveau de consommation énergétique du
      bâtiment à raccorder, et varie également selon chaque réseau. Sur France
      Chaleur Urbaine, nous considérons que le bâtiment a de fortes chances
      d’être raccordable s’il est à moins de 100 m du réseau, et que le
      raccordement reste envisageable pour des distances comprises entre 100 et
      200 m. Toutefois, seul le gestionnaire du réseau pourra confirmer la
      faisabilité du raccordement, en fonction des caractéristiques du bâtiment
      et de celles du réseau.
      <br />
      <br />
      <ul>
        <li>
          <b>Le type de bâtiment :</b>
        </li>
      </ul>
      Le raccordement s’envisage surtout pour des{' '}
      <b>
        bâtiments résidentiels collectifs (copropriété, logement social…) et
        tertiaires d’une taille suffisante
      </b>
      , ce qui permet de mutualiser et amortir les coûts fixes. Le raccordement
      des maisons individuelles est possible dans certains cas, mais reste plus
      rare. La sous-station dessert alors souvent un groupe de maisons
      (lotissement par exemple).
      <br />
      <br />
      <ul>
        <li>
          <b>Le mode de chauffage actuel :</b>
        </li>
      </ul>
      Les <b>bâtiments déjà équipés d’un chauffage collectif (gaz ou fioul)</b>{' '}
      sont les plus faciles à raccorder au chauffage urbain. En effet, ils
      disposent de la tuyauterie nécessaire et des équipements adaptés au sein
      des logements. Lorsque le bâtiment est chauffé au gaz individuel, les
      logements disposent des équipements adaptés mais le réseau secondaire, qui
      permettra de distribuer la chaleur au sein de l’immeuble, devra être créé.
      Cela peut s’avérer coûteux et nécessite des travaux conséquents. Enfin, le
      cas le moins favorable est celui des bâtiments chauffés à l’électricité,
      pour lesquels le raccordement au chauffage urbain impliquera de mettre en
      place à la fois les équipements au sein des logements et le réseau
      secondaire, donc des travaux très coûteux et conséquents aussi bien dans
      les logements que dans les parties communes.
      <br />
      <br />
      <br />
      <Subtitle ref={obligationRef}>
        Existe-t-il des obligations de raccordement au chauffage urbain ?
      </Subtitle>
      <WithImage>
        <div>
          Il existe une{' '}
          <b>
            obligation de raccordement pour les bâtiments neufs ou renouvelant
            leur installation de chauffage au-dessus d’une certaine puissance
          </b>
          , dès lors qu’ils sont situés{' '}
          <b>
            dans le périmètre de développement prioritaire d’un réseau de
            chauffage urbain classé
          </b>
          .
          <br />
          <br />
          <ul>
            <li>
              <b>Quels sont les réseaux de chaleur concernés ?</b>
            </li>
          </ul>
          La loi Énergie Climat de 2019 et la loi Climat et Résilience de 2021
          ont instauré le classement automatique des réseaux de chaleur.{' '}
          <b>
            Tous les réseaux de service public sont désormais automatiquement
            classés dès lors qu’ils répondent aux trois critères suivants :
          </b>
          <ul>
            <ul>
              <li>
                un taux d’énergies renouvelables et de récupération supérieur à
                50 %,
              </li>
              <li> un comptage de la chaleur livrée par point de livraison,</li>
              <li> un équilibre financier assuré.</li>
            </ul>
          </ul>
          <br />
          <b>636 réseaux de chaleur sont concernés</b> (arrêté du 23 décembre
          2022 relatif au classement des réseaux de chaleur et de froid). À
          noter que la collectivité a toutefois la possibilité de délibérer sur
          le non-classement du réseau si elle souhaite s’y opposer, en
          justifiant les motifs.
        </div>
        <Infographie
          src="/img/FCU_Infographie_Classement_small.jpg"
          alt="Classement des réseaux de chaleur"
        />
      </WithImage>
      <br />
      <ul>
        <li>
          <b>Où s’applique l’obligation de raccordement ?</b>
        </li>
      </ul>
      L’obligation de raccordement s’applique{' '}
      <b>
        dans une certaine zone autour du réseau de chaleur qualifiée de « 
        périmètre de développement prioritaire ».
      </b>{' '}
      Les collectivités ont jusqu’au 1er juillet 2023 pour définir ce périmètre,
      par délibération. Au-delà de cette date, un périmètre par défaut
      s’appliquera, qui correspond au périmètre du contrat de concession, ou en
      l’absence de concession au périmètre du territoire de la ou des communes
      desservies par le réseau.
      <br />
      La <Link href="/carte">cartographie France Chaleur Urbaine</Link> permet
      de visualiser les réseaux répondant aux critères du classement, et leur
      périmètre de développement prioritaire dès lors que celui-ci a été
      transmis par la collectivité.
      <br />
      <br />
      <ul>
        <li>
          <b>Quels sont les bâtiments concernés ?</b>
        </li>
      </ul>
      Sont{' '}
      <Link href="/ressources/prioritaire#contenu">
        concernés par l’obligation
      </Link>{' '}
      de raccordement au chauffage urbain :
      <ul>
        <ul>
          <li>
            tout <b>bâtiment neuf</b> dont les besoins de chauffage sont
            supérieurs à une puissance de 30 kW ;
          </li>
          <li>
            tout <b>bâtiment renouvelant son installation de chauffage</b>{' '}
            au-dessus d’une puissance de 30 kW.
          </li>
        </ul>
      </ul>
      <br />
      La collectivité peut choisir de relever le seuil de puissance au-dessus de
      30 kW.
      <br />
      <br />
      Des dérogations peuvent être sollicitées dans les cas suivants
      uniquement :
      <ul>
        <ul>
          <li>
            besoins de chaleur ou de froid incompatibles avec les
            caractéristiques techniques du réseau ;
          </li>
          <li>
            installation qui ne peut être alimentée par le réseau dans les
            délais nécessaires ;
          </li>
          <li>
            solution mise en œuvre alimentée par des énergies renouvelables et
            de récupération à un taux supérieur à celui du réseau classé ;
          </li>
          <li>
            coût manifestement disproportionné pour le raccordement et
            l’utilisation du réseau.
          </li>
        </ul>
      </ul>
      <br />
      <br />
      <Subtitle ref={accompagnementRef}>
        Comment être accompagné dans mon projet de raccordement ?
      </Subtitle>
      La première question à se poser avant le changement d’un mode de chauffage
      est celle de l’isolation du bâtiment.{' '}
      <b>
        La rénovation thermique d’un bâtiment énergivore est le premier réflexe
        à avoir
      </b>{' '}
      pour réduire son impact écologique et ses factures d’énergie. Il convient
      de réaliser les travaux nécessaires avant de souscrire un contrat pour une
      puissance de chauffage donnée, qui pourrait s’avérer surestimée suite à la
      rénovation du bâtiment.{' '}
      <b>
        Les conseillers France Rénov’ accompagnent l’ensemble des projets de
        rénovation de l’habitat
      </b>{' '}
      :{' '}
      <a href="https://france-renov.gouv.fr/" target="_blank" rel="noreferrer">
        https://france-renov.gouv.fr/
      </a>
      .
      <br />
      <br />
      Le{' '}
      <b>
        service France Chaleur Urbaine met à disposition toutes les informations
        utiles pour envisager un raccordement au chauffage urbain
      </b>{' '}
      (atouts, aides financières disponibles, étapes d’un raccordement…) et{' '}
      <b>
        assure la mise en relation avec les gestionnaires des réseaux de chaleur
      </b>
      . Ces derniers sont les seuls à pouvoir confirmer la faisabilité du
      raccordement et à fournir un devis pour le raccordement.
      <br />
      <br />
      <br />
      <Subtitle ref={aidesRef}>
        Quelles sont les aides financières disponibles ?
      </Subtitle>
      La principale aide pour se raccorder au chauffage urbain est le «{' '}
      <b>
        <Link href="/ressources/aides#contenu">
          Coup de pouce chauffage des bâtiments résidentiels collectifs et
          tertiaires
        </Link>
      </b>{' '}
       », mis en place dans le cadre du dispositif des certificats d’économie
      d’énergie. Le montant de cette prime est fonction du nombre de logements
      du bâtiment pour de l’habitat collectif, et de la surface pour un bâtiment
      tertiaire. À titre d’exemple, une aide de plus de 50 000 € peut être
      perçue par une copropriété d’une centaine de lots, permettant ainsi de
      réduire le coût par logement du raccordement au chauffage urbain à
      quelques centaines d’euros seulement.
      <br />
      <br />
      La prime peut être sollicitée auprès des différents signataires de la
      charte « coup de pouce chauffage des bâtiments résidentiels, collectifs et
      tertiaires » (une seule prime par opération), dont la liste est accessible{' '}
      <a
        href="https://www.ecologie.gouv.fr/sites/default/files/CdP%20Chauffage%20B%C3%A2timents%20r%C3%A9sidentiels%20collectifs%20et%20tertiaires%20-%20Les%20offres%20Coup%20de%20pouce.pdf"
        target="_blank"
        rel="noreferrer"
      >
        ici
      </a>
      .{' '}
      <b>
        Son montant est fortement variable d’un signataire à l’autre, il est
        donc primordial de solliciter plusieurs devis pour comparer les offres !
      </b>
      <br />
      <br />
      <Link href="/ressources/financement#contenu">
        D’autres aides peuvent être mobilisées
      </Link>{' '}
      <b>
        lorsque le raccordement au chauffage urbain s’inscrit dans le cadre
        d’une rénovation plus globale
      </b>
      , par exemple MaPrimeRénov’Copropriétés, MaPrimeRénov’Sérénité pour les
      ménages modestes, ou encore le « coup de pouce rénovation performante de
      bâtiment résidentiel collectif ». Le raccordement au chauffage urbain est
      obligatoire pour bénéficier de ce dernier, dès lors qu’il est
      techniquement possible.
      <br />
      <br />
    </Container>
  );
};

export default DistrictHeating;
