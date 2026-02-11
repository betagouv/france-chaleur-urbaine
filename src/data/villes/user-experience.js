import { CounterItem } from '@/components/MarkdownWrapper/MarkdownWrapper.style';

const userExperience = [
  {
    body: (
      <>
        <CounterItem>01.</CounterItem>
        <p>
          Anne est copropriétaire d’un immeuble de 126&nbsp;logements répartis en 3 bâtiments.
          <br />
          La chaudière collective au gaz ayant 20&nbsp;ans le conseil syndical cherche un chauffage plus performant.
          <br />
          <strong>Elle vérifie sur France Chaleur Urbaine si la copropriété est raccordable.</strong>
        </p>
      </>
    ),
    imgAlt: `Portrait d’Anne`,
    imgSrc: `/img/user-experience-1.png`,
  },
  {
    body: (
      <>
        <CounterItem>02.</CounterItem>
        <p>
          <strong>Un réseau de chaleur passe à 15 mètres.</strong>
          <br /> Par l’entremise de France Chaleur Urbaine, le gestionnaire du réseau prend contact avec Anne pour l’informer sur les
          conditions de raccordement.
          <br />
          <strong>Le devis est présenté à l'ensemble des copropriétaires</strong> pour être voté en AG extraordinaire.
        </p>
      </>
    ),
    imgAlt: `Présentation de France Chaleur Urbaine`,
    imgSrc: `/img/user-experience-2.png`,
    reverse: true,
  },
  {
    body: (
      <>
        <CounterItem>03.</CounterItem>
        <p>
          Les frais de raccordements s’élèvent à <strong>120 000€</strong>.<br />
          La copropriété d’Anne obtient des aides au titre du Coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires.{' '}
          <br />
          <strong>Le coût du raccordement baisse à 76 000€ !</strong>
          <br /> <strong>Soit 230€ par lot environ.</strong>
          <br />
          <br />
          Les travaux durent 4 mois en tout comprenant le remplacement de la chaudière par une sous-station et le raccordement au réseau
          passant à 15 m.
        </p>
      </>
    ),
    imgAlt: `Charge et travaux pour un raccordement au Réseau de chaleur`,
    imgSrc: `/img/user-experience-3.png`,
  },
  {
    body: (
      <>
        <CounterItem>04.</CounterItem>
        <p>
          Depuis Anne profite d’une bonne température de chauffe et une distribution d’eau chaude sans panne, avec un{' '}
          <strong>budget maîtrisé, de 108€/mois pour son T4</strong>.<br />
          <br /> Toute la copropriété est heureuse d’avoir eu{' '}
          <strong>une démarche écologique et économique qui a été simplifiée par l’accompagnement de France Chaleur Urbaine</strong>.
        </p>
      </>
    ),
    imgAlt: `Le confort d’un éeseau de chaleur Urbaine`,
    imgSrc: `/img/user-experience-4.png`,
    reverse: true,
  },
];

export default userExperience;
