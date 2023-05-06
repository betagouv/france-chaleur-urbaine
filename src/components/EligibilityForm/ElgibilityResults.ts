import { AvailableHeating } from 'src/types/AddressData';
import { HeatNetworksResponse } from 'src/types/HeatNetworksResponse';

const closeCollectif = {
  eligibility: true,
  futurHeader: `**Bonne nouvelle ! Un réseau de chaleur passera bientôt à proximité de cette adresse (prévu ou en construction).**`,
  body: (
    distance: number,
    inZDP: boolean,
    gestionnaire: string | null,
    tauxENRR: number | null
  ) => `
### Bonne nouvelle !


::arrow-item[**Un réseau de chaleur passe à proximité** immédiate de votre adresse (${distance}).]
${
  inZDP
    ? '::arrow-item[**Vous êtes dans le périmètre de développement prioritaire** du réseau. Une obligation de raccordement peut s’appliquer ([en savoir plus](/ressources/prioritaire#contenu)).]'
    : ''
}
::arrow-item[Avec un chauffage collectif, **votre immeuble dispose déjà des équipements nécessaires :** il s’agit du cas le plus favorable pour un raccordement !]
${
  gestionnaire
    ? `::arrow-item[Le gestionnaire du réseau le plus proche est **${gestionnaire}**.${
        tauxENRR
          ? ` Le taux d’énergies renouvelables et de récupération du réseau est de **${tauxENRR}%**.`
          : ''
      }]`
    : ''
}
`,
  text: `
**France Chaleur Urbaine** est un service gratuit du Ministère de la transition énergétique qui vous permet d’être **mis en relation avec le gestionnaire** du réseau le plus proche de chez vous **afin de bénéficier d’une première estimation tarifaire gratuite et sans engagement.**
**Il vous suffit pour cela de déposer vos coordonnées ci-dessous.**
`,
};

const closeIndividual = {
  eligibility: false,
  futurHeader: `Un réseau de chaleur passera bientôt à proximité de votre adresse (prévu ou en construction), toutefois au vu de votre chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.`,
  body: (distance: number) => `
::arrow-item[**Votre immeuble est situé à proximité** immédiate d’un réseau de chaleur (${distance}).]
::arrow-item[Toutefois au vu de votre chauffage actuel, **le raccordement de votre immeuble nécessiterait des travaux conséquents** et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.]
::arrow-item[**L’amélioration de l’isolation thermique de votre immeuble** constitue un autre levier pour réduire votre facture énergétique et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [**France Rénov’**](https://france-renov.gouv.fr/).]
::arrow-item[Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage).]
  `,
  text: `
**France Chaleur Urbaine** est un service gratuit du Ministère de la transition énergétique qui vous permet de découvrir **instantanément** si un réseau passe près de chez vous
Votre situation n’est pas favorable **pour un raccordement, mais si vous souhaitez tout de même en savoir plus ou faire connaître votre demande**, laissez-nous vos coordonnées pour que nous les transmettions à votre collectivité ou au **gestionnaire du réseau le plus proche.**
  `,

  bodyLight: `
Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble`,
};

const intermediateCollectif = {
  eligibility: true,
  futurHeader: `**Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur, toutefois un réseau passera prochainement dans les environs (prévu ou en construction).**`,
  body: (
    distance: number,
    inZDP: boolean,
    gestionnaire: string | null,
    tauxENRR: number | null
  ) => `
::arrow-item[Il n’existe pour le moment pas de réseau de chaleur à proximité immédiate de votre adresse, toutefois, le réseau n’est pas très loin (${distance}).]
${
  inZDP
    ? '::arrow-item[De plus, vous êtes dans le périmètre de développement prioritaire du réseau le plus proche. Une obligation de raccordement peut s’appliquer ([en savoir plus](/ressources/prioritaire#contenu)).]'
    : ''
}
::arrow-item[Avec un chauffage collectif, votre immeuble dispose déjà des équipements nécessaires : il s’agit du cas le plus favorable pour un raccordement !]
${
  gestionnaire
    ? `::arrow-item[Le gestionnaire du réseau le plus proche est **${gestionnaire}**.${
        tauxENRR
          ? ` Le taux d’énergies renouvelables et de récupération du réseau est de **${tauxENRR}%**.`
          : ''
      }]`
    : ''
}
  `,
  text: `
**France Chaleur Urbaine** est un service gratuit du Ministère de la transition énergétique qui vous permet d’être **mis en relation avec le gestionnaire** du réseau le plus proche **afin de vérifier la faisabilité du raccordement et de bénéficier d’une première estimation tarifaire gratuite et sans engagement.**
**Il vous suffit pour cela de déposer vos coordonnées ci-dessous.**
  `,
};

const farIndividual = {
  eligibility: false,
  body: (distance: number) => `
::arrow-item[**Votre immeuble n'est pas situé à proximité** immédiate d’un réseau de chaleur (${distance}).]
::arrow-item[Toutefois au vu de votre chauffage actuel, **le raccordement de votre immeuble nécessiterait des travaux conséquents** et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.]
::arrow-item[**L’amélioration de l’isolation thermique de votre immeuble** constitue un autre levier pour réduire votre facture énergétique et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [**France Rénov’**](https://france-renov.gouv.fr/).]
::arrow-item[Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage).]
    `,
  text: `
**France Chaleur Urbaine** est un service gratuit du Ministère de la transition énergétique qui vous permet de découvrir **instantanément** si un réseau passe près de chez vous
Votre situation n’est pas favorable **pour un raccordement, mais si vous souhaitez tout de même en savoir plus ou faire connaître votre demande**, laissez-nous vos coordonnées pour que nous les transmettions à votre collectivité ou au **gestionnaire du réseau le plus proche.**
    `,
  bodyLight: `
Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble`,
};

const farCollectifInZdp = {
  eligibility: false,
  body: (
    distance: number,
    inZDP: boolean,
    gestionnaire: string | null,
    tauxENRR: number | null
  ) => `
::arrow-item[**Il n’existe pour le moment pas de réseau de chaleur** à proximité de votre adresse.]
::arrow-item[Toutefois, les réseaux de chaleur se développent et vous êtes dans le périmètre de développement prioritaire du réseau le plus proche. Une obligation de raccordement peut s’appliquer (en savoir plus).]
${
  gestionnaire
    ? `::arrow-item[Le gestionnaire du réseau le plus proche est **${gestionnaire}**.${
        tauxENRR
          ? ` Le taux d’énergies renouvelables et de récupération du réseau est de **${tauxENRR}%**.`
          : ''
      }]`
    : ''
}
  `,
  text: `
**France Chaleur Urbaine** est un service gratuit du Ministère de la transition énergétique qui vous permet d’être **mis en relation avec le gestionnaire** du réseau le plus proche de chez vous **afin d’en savoir plus et de bénéficier d’une première estimation tarifaire gratuite et sans engagement.**
**Il vous suffit pour cela de déposer vos coordonnées ci-dessous.**
`,
};

const farCollectifOutZdp = {
  eligibility: false,
  body: () => `
::arrow-item[**Il n’existe pour le moment pas de réseau de chaleur** à proximité de votre adresse. Toutefois les réseaux de chaleur se développent !]
::arrow-item[Sans attendre, pour réduire votre facture énergétique et limiter votre impact écologique, pensez à améliorer l’isolation thermique de votre immeuble. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [**France Rénov’**](https://france-renov.gouv.fr/).]
::arrow-item[Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage).]
`,
  text: `
**France Chaleur Urbaine** est un service gratuit du Ministère de la transition énergétique qui vous permet de découvrir **instantanément** si un réseau passe près de chez vous
**Contribuez au développement des réseaux de chaleur en faisant connaître votre souhait de vous raccorder !** Laissez-nous vos coordonnées pour être tenu informé par le gestionnaire du réseau le plus proche ou par votre collectivité des projets d’extension de réseau ou de création de réseau dans votre quartier.
`,
};

const iris = {};

export const getEligibilityResult = (
  heatingType: AvailableHeating,
  eligibility?: HeatNetworksResponse
) => {
  if (eligibility && heatingType) {
    if (eligibility.isEligible) {
      if (eligibility.isBasedOnIris) {
        return iris;
      }
      if (
        eligibility.distance !== null &&
        eligibility.veryEligibleDistance !== null
      ) {
        if (eligibility.distance <= eligibility.veryEligibleDistance) {
          return heatingType === 'collectif' ? closeCollectif : closeIndividual;
        }
        return heatingType === 'collectif'
          ? intermediateCollectif
          : farIndividual;
      }
    }

    return heatingType === 'collectif'
      ? eligibility.inZDP
        ? farCollectifInZdp
        : farCollectifOutZdp
      : farIndividual;
  }

  return {};
};

export const bordeauxMetropoleCityCodes = [
  '33003',
  '33004',
  '33013',
  '33032',
  '33039',
  '33056',
  '33063',
  '33065',
  '33069',
  '33075',
  '33096',
  '33119',
  '33162',
  '33167',
  '33192',
  '33200',
  '33249',
  '33273',
  '33281',
  '33312',
  '33318',
  '33376',
  '33434',
  '33449',
  '33487',
  '33519',
  '33522',
  '33550',
];
