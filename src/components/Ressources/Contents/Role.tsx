import { List, Subtitle } from './Contents.styles';

const contents = [
  {
    title:
      'Comment réduire les émissions de gaz à effet de serre des bâtiments ?',
    description:
      'Pour réduire les émissions de gaz à effet de serre des bâtiments, trois leviers existent :',
    list: [
      <>
        La <b>sobriété énergétique</b>, qui passe par des changements de
        comportement (par exemple, réduire la température de chauffe de son
        logement).
      </>,
      <>
        L’<b>efficacité énergétique</b>, qui vise à aboutir au même résultat en
        consommant moins d’énergie (par exemple, en isolant les bâtiments)
      </>,
      <>
        La <b>décarbonation</b>, c’est-à-dire le recours à des énergies
        faiblement émettrices de gaz à effet de serre, par exemple en remplaçant
        une chaudière gaz ou fioul par un{' '}
        <b>raccordement à un réseau de chaleur</b> majoritairement alimenté par
        des énergies renouvelables et de récupération.
      </>,
    ],
  },
  {
    title: 'Des objectifs ambitieux fixés par la loi',
    description: (
      <>
        La loi énergie climat fixe un objectif de{' '}
        <b>neutralité carbone en 2050</b>, ce qui implique de diviser par 6 nos
        émissions de gaz à effet de serre par rapport à 1990. Un recours plus
        massif aux réseaux de chaleur peut efficacement y contribuer.
        <br />
        <br />
        Dès 2015, la loi relative à la transition énergétique pour la croissance
        verte a fixé l’objectif de multiplier par 5 la quantité de chaleur et de
        froid renouvelables et de récupération livrée par les réseaux d’ici 2030
        (réf. 2012).{' '}
        <b>
          Il faudrait tripler le rythme actuel pour atteindre cet objectif !
        </b>
        <br />
        <br />
        Pour cela, il est indispensable de :
      </>
    ),
    list: [
      <>
        <b>“Verdir” les réseaux de chaleur existants</b>, c’est-à-dire augmenter
        encore la part d’énergies renouvelables et de récupération.
      </>,
      <>
        <b>“Densifier” les réseaux de chaleur existants</b>, c’est-à-dire y
        raccorder davantage de bâtiments.
      </>,
      <>
        <b>Créer de nouveaux réseaux</b> ou des extensions de réseaux.
      </>,
    ],
  },
  {
    title:
      'Plusieurs mesures et dispositifs mis en place pour atteindre ces objectifs',
    description:
      'La dynamique de raccordement aux réseaux de chaleur devrait s’accélérer suite à la mise en place des mesures suivantes :',
    list: [
      <>
        <b>Interdiction de renouvellement des chaudières fioul</b> depuis le 1er
        juillet 2022 : là où ils sont présents, les réseaux de chaleur
        constituent une des meilleures alternatives.
      </>,
      <>
        <b>Classement automatique des réseaux</b> alimentés majoritairement par
        des énergies renouvelables et de récupération : dans une certaine zone
        autour du réseau, obligation de se raccorder pour toute construction
        neuve ou renouvelant sa chaudière au-dessus d’un certain seuil de
        puissance.
      </>,
      <>
        Mise en place du{' '}
        <b>
          coup de pouce chauffage des bâtiments résidentiels collectifs et
          tertiaires
        </b>{' '}
        (aides financières conséquentes pour le raccordement de ces bâtiments
        aux réseaux de chaleur, attribuées dans le cadre du dispositif des
        certificats d’économies d’énergie).
      </>,
      <>
        <b>Dispositif éco-énergie tertiaire</b> favorable aux réseaux de chaleur
        : par le jeu des coefficients de conversion, se raccorder à un réseu de
        chaleur permet de comptabiliser jusqu’à 23% de réduction des
        consommations d’énergie.
      </>,
    ],
  },
];

const Role = () => {
  return (
    <>
      <img width="100%" src="/img/ressources-role.png" alt="" />
      {contents.map((content) => (
        <div key={content.title}>
          <br />
          <br />
          <Subtitle>{content.title}</Subtitle>
          {content.description}
          <List>
            {content.list.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </List>
        </div>
      ))}
    </>
  );
};

export default Role;
