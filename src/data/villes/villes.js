const villesData = [
  {
    name: 'Paris',
    nameNetwork: 'Paris',
    description: `Mis en service en 1927, le réseau de chaleur parisien est l'un des premiers réseaux créés en France. Il s'est progressivement étendu et modernisé.
**Aujourd'hui, 6000 bâtiments sont desservis par le réseau**: des copropriétés, des entreprises, la quasi-totalité des hôpitaux parisiens, des monuments historiques... Parmi les bâtiments emblématiques raccordés, on peut par exemple mentionner Le Grand Palais, le musée d’Orsay ou encore l’Opéra Garnier. Le raccordement de la cathédrale Notre-Dame de Paris est également en cours. **Le réseau de chaleur de Paris assure ainsi le chauffage d’1/4 des bâtiments de la capitale.**
Le réseau de la capitale alimente également en énergie **16 réseaux de chaleur de la métropole du Grand Paris** : Asnières, Aubervilliers, Boulogne-Billancourt, Charenton-le-Pont, Choisy-le-Roi, Clichy, Gennevilliers, Gentilly, L’Île-Saint-Denis, Issy-les-Moulineaux, Ivry-sur-Seine, Le Kremlin-Bicêtre, Levallois Perret, Saint-Denis, Saint-Ouen et Vitry-sur-Seine.
**La Ville de Paris a l’ambition de développer fortement son réseau de chaleur dans les prochaines années et d’augmenter significativement la part d’énergies renouvelables et de récupération qui l’alimentent** (à hauteur de 75% dès 2030, et de 100% en 2050).`,
    coord: [2.347, 48.859],
    networksData: {
      isClassed: true,
      identifiant: '7501C',
      heatedPlaces: '425 000',
    },
    dispositifs: [
      {
        title: 'Le barème de raccordement au réseau',
        description: `::white-arrow-item[Le Conseil de Paris a adopté le 1er barème de raccordement au réseau réduisant fortement les coûts de raccordement.]
::white-arrow-item[Ce barème améliore fortement les conditions d’accès au réseau de chaleur parisien via une réduction très importante des coûts de raccordements pour les bâtiment situés à proximité du réseau, mais aussi via un cadre clair, transparent et prévisible pour le demandeur d’un raccordement.]`,
        link: {
          title: 'Tout savoir sur ce dispositif',
          href: 'https://www.cpcu.fr/article/un-bareme-simple-et-attractif-de-raccordement-au-reseau-de-chaleur-parisien/',
          target: '_blank',
        },
      },
      {
        description: `::white-arrow-item[L’application du barême est cumulable avec le coup de pouce chauffage des bâtiments résidentiels collectifs et tertiaires, qui permet de réduire encore les coûts de raccordement.]
::white-arrow-item[Sur Paris, un coût supplémentaire est à prévoir pour l’installation de la sous-station qui assure le transfert entre le réseau de chaleur et les canalisations internes à l’immeuble.]`,
        img: {
          alt: 'Icone barème',
          src: '/icons/picto-warning.svg',
        },
      },
    ],
  },
  {
    name: 'Grenoble',
    nameNetwork: 'Grenoble-Alpes Métropole',
    description: `Le réseau de chauffage urbain de Grenoble-Alpes Métropole est l’un des réseaux les plus importants en France et présente un taux d’énergies renouvelables et de récupération particulièrement élevé (proche de 80%). Il alimente en chaleur et en eau chaude sanitaire des bâtiments collectifs publics ou privés, à usage résidentiel, tertiaire ou industriel de 7 villes : **Grenoble, Échirolles, Eybens, Gières, La Tronche, Pont-de-Claix, Saint-Martin-d’Hères**. Sont ainsi raccordés près de 400 copropriétés, 83 établissements scolaires, 31 équipements sportifs et 5 centres nautiques, des centres commerciaux, etc. 
  Le réseau est alimenté par **5 sites de production de chaleur** : Athanor, Villeneuve, Poterne, le CEA, Vaucanson et Biomax. Grenoble-Alpes-Métropole poursuit le verdissement du réseau, avec l’**ambition de tendre vers 100 % d’énergies renouvelables et de récupération fin 2033**.`,
    coord: [5.7243, 45.182081],
    networksData: {
      isClassed: true,
      identifiant: '3802C',
      heatedPlaces: '100 000',
    },
  },
  {
    name: 'Lyon',
    nameNetwork: 'Lyon',
    description: `**Aujourd’hui, le réseau de chaleur urbain Centre Métropole alimente en chauffage collectif et en eau chaude l’équivalent de 45 000 logements.** Le réseau est principalement alimenté par la récupération de l’énergie issue de l’incinération des ordures ménagères, complétée par des chaufferies gaz et biomasse, dont la principale a été mise en service en 2019 à Surville. Le réseau compte plusieurs unités de production : Gerland, Surville, Beauvisage, Bron Parilly, Carré de Soie et Einstein.
    
Demain, **la distribution en énergie sera triplée** pour accompagner le développement de l’agglomération à l’Est en desservant l’équivalent de 130 000 logements. Le développement du réseau concernera les **3ème, 6ème, 7ème et 8ème arrondissements** de Lyon ainsi que **Villeurbanne, Vaulx-en-Velin (carré de soie), Bron et Vénissieux nord**.

A noter que la Métropole compte **4 autres réseaux** : Givors, Ouest Lyonnais, Plateau Nord (ex Rillieux-La Pape-Sathonay-Camp), Grand Ile (ex Vaux-en-Velin), Vénissieux. Lyon Centre Métropole dispose également d’un réseau de froid, qui permet de rafraîchir plus d’un million de m2 de bureaux et commerces dans le quartier d’affaire de la Part-Dieu.`,
    coord: [4.835, 45.758],
    networksData: {
      isClassed: true,
      identifiant: '6905C',
      heatedPlaces: '45 000',
    },
    dispositifsTitle: `Écoréno'v`,
    dispositifs: [
      {
        description: `::white-arrow-item[**ECORENO’V est un service de la Métropole de Lyon** pour conseiller et accompagner les projets d’éco-rénovation de l’habitat. Tous les porteurs de projets peuvent prendre contact avec l’ALEC Lyon, porte d’entrée du dispositif.]`,
        link: {
          title: 'Voir le site',
          href: 'https://www.alec-lyon.org/services/aides-et-accompagnements/ecorenov-service-aide-eco-renovation-des-logements/',
          target: '_blank',
        },
      },
      {
        description: `::white-arrow-item[**Certaines villes de la Métropole proposent des aides supplémentaires**]`,
        link: {
          title: 'En savoir plus',
          href: 'https://seafile.alte69.org/f/8cb90e13900c4d3fb299/',
          target: '_blank',
        },
      },
    ],
  },
  {
    name: 'Aix-en-Provence',
    nameNetwork: 'Aix-en-Provence',
    description: `**Le réseau de chaleur d’Aix-en-Provence permet d’éviter le rejet de 18 750 tonnes de CO2 par an grâce au recours à la biomasse.**

C’est en 1967 que le réseau de chaleur aixois est né, initialement pour chauffer les habitants d’Encagnane par une petite chaufferie installée dans le quartier qui fonctionnait alors au fioul. Celle-ci a progressivement laissé place en 2014 à une chaufferie biomasse qui fournit aujourd’hui, grâce à deux chaudières bois de 8,8 MWh et 111 GWh consommés, le chauffage et l’eau chaude sanitaire de 9500 foyers, soit un peu plus de 28 000 Aixois.

La chaufferie bois aixoise ayant atteint sa capacité maximale de production, un nouveau schéma directeur a été validé en 2021. Il porte essentiellement sur l’**extension du réseau de chaleur urbain à l’ensemble de la ville ainsi que sur la possibilité d’implanter une nouvelle unité de production, à l’ouest**. Cette dernière comprendrait une chaufferie biomasse et une centrale solaire thermique : le Jas de Bouffan serait ainsi décarboné.

**Dans les prochaines années, le réseau sera donc étendu à l’ouest et à l’est de la ville et verra son taux d’énergies renouvelables porté à 80%.**`,
    coord: [5.406124, 43.541369],
    networksData: {
      isClassed: true,
      identifiant: '1317C',
      heatedPlaces: '9500',
    },
  },
  {
    name: 'Metz',
    nameNetwork: 'Metz',
    description: `**Le réseau de chauffage urbain de l’Eurométropole de Metz est l’un des plus importants de France.** Il représente aujourd’hui une longueur de 140 kilomètres couvrant une grande partie de la ville de Metz et de sa périphérie. En 2021, plus de 483 GWh de chaleur ont été livrés aux clients, soit l‘équivalent de **plus de 48 000 logements** de type T3 alimentés. **Le réseau bénéficie d’un taux d’énergies renouvelables et de récupération de plus de 65%**, grâce à la valorisation de la chaleur issue de l’incinération des ordures ménagères et à une centrale biomasse utilisant les ressources en bois locales.

Le réseau est né en 1956 : il exploitait alors les installations de production thermique de Pontiffroy. En 1961, une centrale dédiée plus performante a été mise en service sur le site de Metz Chambière, puis en 1970 une liaison a été établie entre la centrale et l’usine d’incinération des ordures ménagères à proximité, afin d’en récupérer la chaleur. Le réseau a pu significativement augmenter son taux d’énergies renouvelables en 2013, avec l’ajout d’une centrale biomasse sur le site de Metz Chambière. Initialement limité à la ville de Metz, il se déploie aujourd’hui sur le territoire de l’Eurométropole (Montigny-les-Metz, le Ban-Saint-Martin, ...).`,
    coord: [6.194897, 49.108385],
    networksData: {
      isClassed: true,
      identifiant: '5701C',
      heatedPlaces: '48 000',
    },
  },
  {
    name: 'Nantes',
    nameNetwork: 'Nantes Métropole',
    description: `La métropole compte à ce jour **7 réseaux de chaleur, les principaux étant ceux de Nantes, Nord-Chézine et Bellevue Saint-Herblain**. Au total, 145 km de réseaux chauffent 37 700 logements, soit 12% des logements de la métropole. Sont également raccordés de nombreux équipements publics : CHU, palais de justice, musées, piscine Jules-Verne, Lycée Mandela, campus Tertre et Lombarderie... La chaleur distribuée par les réseaux de la métropole est produite au niveau de différents sites de production : des chaufferies biomasse comme celles de Rezé et Malakoff, qui utilisent principalement des déchets forestiers, mais aussi des centrales d’incinération des ordures ménagères dont la chaleur est récupérée, comme celles de Couëron et de la Prairie de Mauves.
**Les réseaux de la métropole nantaise poursuivent leur développement.** Une nouvelle branche a par exemple été créé au réseau de Nord-Chézine en 2022, permettant d’alimenter 860 logements supplémentaires ainsi que des bureaux et commerces, et d’éviter l’émission de 1000 tonnes de CO2 par an. Le Sillon de Bretagne, emblématique immeuble de Saint-Herblain, a ainsi pu y être raccordé.
**La métropole souhaite également augmenter la part d’énergies renouvelables et de récupération alimentant ses réseaux, pour atteindre un taux de 100% d’ici 2050.**`,
    coord: [-1.555335, 47.239367],
    networksData: {
      isClassed: true,
      gestionnaires: `Les réseaux sont gérés par **Idex** et **Engie**`,
    },
  },
  {
    name: 'Bordeaux',
    nameNetwork: 'Bordeaux Métropole',
    description: `La Métropole bordelaise compte de nombreux réseaux de chaleur, qui desservent notamment **les Hauts de Garonne** (Lormont, Cenon, Floirac), le quartier **Ginko à Bordeaux**, les quartiers **Bacalan** et **Bassins à flots** à Bordeaux, les hôpitaux **Pellegrin** et **Charles Perrens** à Bordeaux, le quartier **Mériadeck** à Bordeaux, **l’Université de Bordeaux**, le quartier de **Pessac–Saige**, la **Base Aérienne 106** à Mérignac, le quartier **Bordeaux-Saint Jean Belcier** (en cours de construction), le quartier du Grand-Parc...

La chaleur distribuée par les réseaux de la métropole est **produite sur différents sites**, à partir de différentes sources d’énergie : des chaufferies biomasse, des forages géothermiques (par exemple sur le réseau de Plaine de Garonne énergies ou à Mériadeck), la chaleur récupérée de l’incinération des ordures ménagères comme à Cenon ou Bègles, ou encore la récupération des calories issues des eaux usées, comme au niveau de la station d’épuration Louis Fargue.

La métropole bordelaise souhaite **doubler le nombre d’habitants raccordés aux divers réseaux de chaleur d’ici 2035**. La création de nouveaux réseaux de chaleur est envisagée, avec notamment un projet de réseau Métropole Sud qui concerne Bordeaux, Gradignan, Pessac et Talence avec une extension possible vers Bègles, Villenave-d'Ornon et Mérignac`,
    coord: [-0.587877, 44.851895],
    networksData: {
      isClassed: true,
      gestionnaires: `Les réseaux sont gérés **soit directement en régie** par la Métropole, **soit par des opérateurs privés** dans le cadre de délégations de service public (**Mixéner, ENGIE, Dalkia...**)`,
    },
    dispositifsTitle: 'Ma Rénov Bordeaux Métropole',
    dispositifs: [
      {
        description: `::white-arrow-item[**Bordeaux Métropole vous accompagne dans la rénovation énergétique de votre logement.** Obtenez jusqu'à 50 % d'aides pour la réalisation du Diagnostic Technique Général de votre copropriété et d'une assistance à la maîtrise d'ouvrage jusqu'à la réception des travaux.]`,
        link: {
          title: 'Voir le site',
          href: 'https://marenov.bordeaux-metropole.fr/',
          target: '_blank',
        },
      },
    ],
  },
  {
    name: 'Strasbourg',
    nameNetwork: 'Strasbourg Métropole',
    description: `Le territoire de l’Eurométropole de Strasbourg comporte plusieurs réseaux de chaleur. **Les réseaux publics de l’Eurométropole alimentent l’équivalent de 50000 logements grâce à 130 km de canalisations. L’énergie qu’ils distribuent est d’origine renouvelable à plus de 50 % (essentiellement bois et ordures ménagères).** Plusieurs quartiers de la métropole sont desservis par ces réseaux, en particulier : Elsau, L’Esplanade, Hautepierre, Wacken...

**Dans le cadre de son Plan Climat 2030, l’Eurométropole de Strasbourg s’est fixé des objectifs importants pour le développement de ses réseaux : un doublement de la quantité d’énergie distribuée et un taux d’énergies renouvelables de 75% d’ici 2030.**

Pour verdir les réseaux de chaleur de la métropole, différentes sources d’énergies sont utilisées. La biomasse et la valorisation de l’énergie de récupération des groupes froid des Hôpitaux universitaires permettront par exemple de décarboner le réseau de Hautepierre-Poteries, jusqu’à présent 100% fossile, avec un taux d’énergies renouvelables supérieur à 65% attendu dès 2028. Le réseau Strasbourg-Centre, actuellement alimenté par l’énergie récupérée auprès de Sénerval, l’unité de valorisation énergétique qui incinère des déchets sur le Rohrschollen, et par la chaufferie biomasse du Port Autonome, sera également verdi pour atteindre un taux d’énergies renouvelables de plus de 80%. Pour cela, l’approvisionnement en chaleur sera complété par l’énergie récupérée auprès de l’aciérie BSW et des industriels du Port Autonome.`,
    coord: [7.761454, 48.579831],
    networksData: {
      isClassed: true,
      gestionnaires: `Les réseaux présents sur la métropole sont gérés par différents opérateurs : **ENGIE, Strasbourg Centre Energies, R-CUA...**`,
    },
  },
  {
    name: 'Rennes',
    nameNetwork: 'Rennes Métropole',
    description: `Cinq réseaux de chauffage urbain sont en service sur le territoire de Rennes Métropole : 
- deux réseaux historiques, créés il y a plus de quarante ans : **le réseau Rennes Nord et le réseau Rennes Sud** ; 
- **le réseau Rennes Est**, en service depuis 2015, qui sera connecté au réseau Nord à l'horizon 2024 ; 
- **le réseau de Vezin-Le-Coquet**, en service depuis 2010 ;
- **le réseau de Chartres-de-Bretagne**, en service depuis 2017. 
Ces réseaux desservent environ 110 000 usagers, principalement à Rennes où le réseau étend sa toile au nord et à l'est de la ville. 

L’interconnexion des réseaux Rennes Nord et Rennes Est permettra d’optimiser l’utilisation de l’énergie valorisée au niveau de l’usine d’incinération des déchets de Villejean. **A terme, le taux d’énergies renouvelables et de récupération du réseau s’élèvera ainsi à 68% et 35 000 équivalent-logements seront raccordés** sur les quartiers de Beauregard, Villejean, Baud-Chardonnet, Gros Chêne, Bourg l’Evêque, Rives de l’Ille, Saint Martin, Maurepas-Gayeulles, Longchamps.

A noter que le territoire compte également des réseaux de chaleur privés, comme le réseau Sarah Bernhardt d'Aiguillon Construction ou encore celui desservant le campus de Beaulieu de l'université Rennes 1.`,
    coord: [-1.68365, 48.110899],
    networksData: {
      isClassed: true,
      gestionnaires: `Les réseaux sont gérés **soit directement en régie** par la Métropole, **soit par des opérateurs privés** dans le cadre de délégations de service public (**Dalkia, ENGIE, SOGEX**)`,
    },
    dispositifsTitle: 'ÉcoTravo',
    dispositifs: [
      {
        description: `::white-arrow-item[Service public gratuit proposé par **Rennes Métropole, écoTravo** a pour objectif d’encourager la rénovation énergétique des maisons individuelles et des copropriétés du territoire.]`,
        link: {
          title: 'Voir le site',
          href: 'https://ecotravo.rennesmetropole.fr/',
          target: '_blank',
        },
      },
    ],
  },
  {
    name: 'Dijon',
    nameNetwork: 'Dijon',
    description: `Dijon comporte **2 réseaux de chaleur interconnectés** : 
- l’un est géré par Dijon énergies (Dalkia) et alimenté à 76% par des énergies renouvelables et de récupération locales : chaufferies bois , unité de valorisation des déchets
- l’autre est géré par Sodien (Coriance) et approvisionné par la chaufferie biomasse de Valendons, avec un taux d’énergies renouvelables de l’ordre de 60%.

**Le raccordement au réseau de chaleur se substitue progressivement aux chaufferies collectives gaz et fioul** : 33 % de l’énergie que la ville consomme est aujourd’hui issue de ces réseaux de chaleur, contre 6 % il y a 10 ans. **55 000 équivalent-logements sont aujourd’hui raccordés.** Les réseaux de chaleur alimentent des bâtiments résidentiels, mais également la Cité internationale de la gastronomie et du vin, le CHU, le campus de l’université de Bourgogne, la gendarmerie Deflandre, les quatre piscines (Olympique, Carrousel, Fontaine-d’Ouche et Grésilles), le stade Gaston-Gérard, l’Auditorium, le parc des expositions et le palais des Congrès, La Vapeur, 10 collèges et 23 groupes scolaires....`,
    coord: [5.034852, 47.331938],
    networksData: {
      isClassed: true,
      gestionnaires: `Les réseaux sont gérés par **Dijon Energies (Dalkia)** et **Sodien (Coriance)**`,
    },
  },
];

export default villesData;
