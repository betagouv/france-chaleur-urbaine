import type React from 'react';

import { ArrowItem } from '@/components/MarkdownWrapper/MarkdownWrapper.style';
import Link from '@/components/ui/Link';
import type { AvailableHeating } from '@/modules/app/types';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';

type EligibilityResult = {
  eligibility?: boolean;
  title?: (params: { distance: string }) => string;
  body: (body: {
    distance: string;
    inPDP: boolean;
    gestionnaire: string | null;
    tauxENRR: number | null;
    isClasse: boolean | null;
    hasPDP: boolean | null;
    city?: string;
  }) => React.ReactNode;
  text: React.ReactNode;
};

type EligibilityResultState =
  // très proche
  | 'closeFuturCollectif'
  | 'closeCollectif'
  | 'closeFuturIndividual'
  | 'closeIndividual'

  // moyennement proche
  | 'intermediateFuturCollectif'
  | 'intermediateCollectif'
  | 'farIndividual'

  // pas proche
  | 'farCollectifInPDP'
  | 'farCollectifOutPDP'

  // réseau sans tracé
  | 'noTraceCollectif'
  | 'noTraceIndividual'
  | 'unknown';

export const getEligibilityResultState = (heatingType: AvailableHeating, eligibility?: HeatNetworksResponse): EligibilityResultState => {
  if (eligibility && heatingType) {
    const futurNetwork = eligibility.futurNetwork;

    if (eligibility.isEligible) {
      if (eligibility.distance !== null && eligibility.veryEligibleDistance !== null) {
        if (eligibility.distance <= eligibility.veryEligibleDistance) {
          if (heatingType === 'collectif') {
            return futurNetwork ? 'closeFuturCollectif' : 'closeCollectif';
          }
          return futurNetwork ? 'closeFuturIndividual' : 'closeIndividual';
        }
        if (heatingType === 'collectif') {
          return futurNetwork ? 'intermediateFuturCollectif' : 'intermediateCollectif';
        }
        return 'farIndividual';
      }
      if (eligibility.distance === null && futurNetwork) {
        return heatingType === 'collectif' ? 'closeFuturCollectif' : 'closeFuturIndividual';
      }
    } else if (eligibility.hasNoTraceNetwork) {
      return heatingType === 'collectif' ? 'noTraceCollectif' : 'noTraceIndividual';
    }

    return heatingType === 'collectif' ? (eligibility.inPDP ? 'farCollectifInPDP' : 'farCollectifOutPDP') : 'farIndividual';
  }
  return 'unknown';
};

export const getEligibilityResult = (
  address: string,
  heatingType: AvailableHeating,
  eligibility?: HeatNetworksResponse
): EligibilityResult => {
  const state = getEligibilityResultState(heatingType, eligibility);
  const AutreSolutionsChauffageItem = ({ collectif = false }) => (
    <ArrowItem>
      <div className="flex flex-col">
        Il existe d’autres solutions de chauffage écologiques et économiques adaptées à votre bâtiment :{' '}
        <Link
          href={`/chaleur-renouvelable?address=${encodeURIComponent(address)}${collectif && `&type=immeuble_chauffage_collectif`}#quel-chauffage`}
          variant="secondary"
          className="fr-mt-3v"
          eventKey="Eligibilité|Formulaire de test - Adresse Inéligible - CTA comparateur"
        >
          Découvrir les autres solutions
          <span className="fr-icon-arrow-right-line fr-icon--right fr-ml-1v" />
        </Link>
      </div>
    </ArrowItem>
  );

  const FranceRenovItem = (
    <ArrowItem>
      Sans attendre, pour réduire votre facture énergétique et limiter votre impact écologique, pensez à améliorer l’isolation thermique de
      votre immeuble. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur{' '}
      <a href="https://france-renov.gouv.fr/" target="_blank" rel="noreferrer">
        France Rénov’
      </a>
    </ArrowItem>
  );

  const ReseauClasseItem = (
    <ArrowItem>
      Ce réseau est classé, ce qui signifie qu’une obligation de raccordement peut exister (
      <a href="/ressources/reseau-classe#contenu" target="_blank" rel="noreferrer">
        en savoir plus
      </a>
      ).
    </ArrowItem>
  );

  const ObligationsRaccordementLink = ({ proche = false }) => (
    <ArrowItem>
      <strong>Vous êtes dans le périmètre de développement prioritaire</strong> du réseau {proche && 'le plus proche'}. Une obligation de
      raccordement peut exister (
      <a href="/ressources/obligations-raccordement#contenu" target="_blank" rel="noreferrer">
        en savoir plus
      </a>
      ). Une amende de 300&nbsp;000€ peut s’appliquer en cas de non-raccordement sans dérogation.
    </ArrowItem>
  );

  // 3 rue du petit bois 78370 Plaisir
  const closeCollectif: EligibilityResult = {
    body: ({ distance, inPDP, gestionnaire, tauxENRR, isClasse, hasPDP, city }) => (
      <>
        <h3>Bonne nouvelle&nbsp;!</h3>
        <ArrowItem>
          <strong>Un réseau de chaleur passe à proximité</strong> immédiate de votre adresse {distance ? `(${distance})` : ''}.
        </ArrowItem>
        {isClasse && !hasPDP && !inPDP && ReseauClasseItem}
        {inPDP && <ObligationsRaccordementLink />}
        <ArrowItem>
          Avec un chauffage collectif, <strong>votre immeuble dispose déjà des équipements nécessaires&nbsp;:</strong> il s’agit du cas le
          plus favorable pour un raccordement&nbsp;!
        </ArrowItem>
        {gestionnaire && (
          <ArrowItem>
            Le gestionnaire du réseau le plus proche est <strong>{gestionnaire}</strong>.
            {tauxENRR ? (
              <>
                {' '}
                Le taux d’énergies renouvelables et de récupération du réseau est de <strong>{tauxENRR}%</strong>.
              </>
            ) : null}
          </ArrowItem>
        )}
        {city === 'Paris' && <p className="fr-text--sm">A noter: sur Paris, la puissance souscrite doit être d’au moins 100&nbsp;kW.</p>}
      </>
    ),
    eligibility: true,
    text: <h4 className="dark-blue">Recevez plus d’informations adaptées à votre bâtiment de la part du gestionnaire du réseau</h4>,
  };

  // 3 rue du petit bois 78370 Plaisir
  const closeIndividual: EligibilityResult = {
    body: ({ distance }) => (
      <>
        <ArrowItem>
          <strong>Votre immeuble est situé à proximité</strong> immédiate d’un réseau de chaleur {distance ? `(${distance})` : ''}.
        </ArrowItem>
        <ArrowItem>
          Toutefois au vu de votre chauffage actuel,{' '}
          <strong>le raccordement de votre immeuble nécessiterait des travaux conséquents</strong> et coûteux, avec notamment la création
          d’un réseau interne de distribution au sein de l’immeuble.
        </ArrowItem>
        <AutreSolutionsChauffageItem />
        {FranceRenovItem}
      </>
    ),
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine</strong> est un service gratuit du Ministère de la transition écologique qui vous permet de
          découvrir <strong>instantanément</strong> si un réseau passe près de chez vous
        </p>
        <p>
          Votre situation n’est pas favorable{' '}
          <strong>pour un raccordement, mais si vous souhaitez tout de même en savoir plus ou faire connaître votre demande</strong>,
          laissez-nous vos coordonnées pour que nous les transmettions à votre collectivité ou au{' '}
          <strong>gestionnaire du réseau le plus proche.</strong>
        </p>
      </>
    ),
  };

  // 1 rue du berry 78370 Plaisir
  const intermediateCollectif: EligibilityResult = {
    body: ({ distance, inPDP, gestionnaire, tauxENRR, isClasse, hasPDP, city }) => (
      <>
        <ArrowItem>
          <strong>Il n’existe pour le moment pas de réseau de chaleur</strong> à proximité immédiate de votre adresse, toutefois, le réseau
          n’est pas très loin {distance ? `(${distance})` : ''}.
        </ArrowItem>
        {isClasse && !hasPDP && !inPDP && ReseauClasseItem}
        {inPDP && <ObligationsRaccordementLink proche />}
        <ArrowItem>
          Avec un chauffage collectif, <strong>votre immeuble dispose déjà des équipements nécessaires</strong> : il s’agit du cas le plus
          favorable pour un raccordement&nbsp;!
        </ArrowItem>
        {gestionnaire && (
          <ArrowItem>
            Le gestionnaire du réseau le plus proche est <strong>{gestionnaire}</strong>.
            {tauxENRR ? (
              <>
                {' '}
                Le taux d’énergies renouvelables et de récupération du réseau est de <strong>{tauxENRR}%</strong>.
              </>
            ) : null}
          </ArrowItem>
        )}
        {city === 'Paris' && <p className="fr-text--sm">A noter: sur Paris, la puissance souscrite doit être d’au moins 100&nbsp;kW.</p>}
      </>
    ),
    eligibility: true,
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine</strong> est un service gratuit du Ministère de la transition écologique qui vous permet d’être{' '}
          <strong>mis en relation avec le gestionnaire</strong> du réseau le plus proche{' '}
          <strong>
            afin de vérifier la faisabilité du raccordement et de bénéficier d’une première estimation tarifaire gratuite et sans
            engagement.
          </strong>
        </p>
        <p>
          <strong>Il vous suffit pour cela de déposer vos coordonnées ci-dessous.</strong>
        </p>
      </>
    ),
  };

  // 1 rue du berry 78370 Plaisir
  const farIndividual: EligibilityResult = {
    body: () => (
      <>
        <AutreSolutionsChauffageItem />
        <ArrowItem>
          Au vu de votre chauffage actuel, <strong>le raccordement de votre immeuble nécessiterait des travaux conséquents</strong> et
          coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.
        </ArrowItem>
        {FranceRenovItem}
      </>
    ),
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine</strong> est un service gratuit du Ministère de la transition écologique qui vous permet de
          découvrir <strong>instantanément</strong> si un réseau passe près de chez vous
        </p>
        <p>
          Votre situation n’est pas favorable{' '}
          <strong>pour un raccordement, mais si vous souhaitez tout de même en savoir plus ou faire connaître votre demande</strong>,
          laissez-nous vos coordonnées pour que nous les transmettions à votre collectivité ou au{' '}
          <strong>gestionnaire du réseau le plus proche.</strong>
        </p>
      </>
    ),
    title: ({ distance }) =>
      `Votre immeuble n'est pas situé à proximité immédiate d’un réseau de chaleur${distance ? ` (${distance})` : ''}`,
  };

  // Limours
  const farCollectifOutPDP: EligibilityResult = {
    body: () => (
      <>
        <AutreSolutionsChauffageItem collectif />
        {FranceRenovItem}
      </>
    ),
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine</strong> est un service gratuit du Ministère de la transition écologique qui vous permet de
          découvrir <strong>instantanément</strong> si un réseau passe près de chez vous
        </p>
        <p>
          <strong>Contribuez au développement des réseaux de chaleur en faisant connaître votre souhait de vous raccorder&nbsp;!</strong>{' '}
          Laissez-nous vos coordonnées pour être tenu informé par le gestionnaire du réseau le plus proche ou par votre collectivité des
          projets d’extension de réseau ou de création de réseau dans votre quartier.
        </p>
      </>
    ),
    title: () => 'Il n’existe pas de réseau de chaleur ouvert au raccordement à proximité de votre adresse pour le moment.',
  };

  // Rue Georges Braque 76600 Le Havre
  const closeFuturCollectif: EligibilityResult = {
    body: ({ distance, inPDP, gestionnaire, tauxENRR, city }) => (
      <>
        <h3>Bonne nouvelle&nbsp;!</h3>
        <ArrowItem>
          <strong>Un réseau de chaleur passera bientôt à proximité</strong> immédiate de votre adresse {distance ? `(${distance})` : ''}{' '}
          (réseau prévu ou en construction).
        </ArrowItem>
        {inPDP && <ObligationsRaccordementLink />}
        <ArrowItem>
          Avec un chauffage collectif, <strong>votre immeuble dispose déjà des équipements nécessaires&nbsp;:</strong> il s’agit du cas le
          plus favorable pour un raccordement&nbsp;!
        </ArrowItem>
        {gestionnaire && (
          <ArrowItem>
            Le gestionnaire du futur réseau le plus proche est <strong>{gestionnaire}</strong>.
            {tauxENRR ? (
              <>
                {' '}
                Le taux d’énergies renouvelables et de récupération du réseau sera de <strong>{tauxENRR}%</strong>.
              </>
            ) : null}
          </ArrowItem>
        )}
        {city === 'Paris' && <p className="fr-text--sm">A noter: sur Paris, la puissance souscrite doit être d’au moins 100&nbsp;kW.</p>}
      </>
    ),
    eligibility: true,
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine est un service public de mise en relation avec les gestionnaires des réseaux.</strong>
        </p>
        <h4>Bénéficiez d'une première étude de faisabilité gratuite et sans engagement.</h4>
      </>
    ),
  };

  // 2 rue hardenberg 92220 Bagneux
  const farCollectifInPDP: EligibilityResult = {
    body: ({ gestionnaire, tauxENRR }) => (
      <>
        <ArrowItem>
          <strong>Il n’existe pour le moment pas de réseau de chaleur</strong> à proximité de votre adresse.
        </ArrowItem>
        <ObligationsRaccordementLink proche />
        {gestionnaire && (
          <ArrowItem>
            Le gestionnaire du réseau le plus proche est <strong>{gestionnaire}</strong>.
            {tauxENRR ? (
              <>
                {' '}
                Le taux d’énergies renouvelables et de récupération du réseau est de <strong>{tauxENRR}%</strong>.
              </>
            ) : null}
          </ArrowItem>
        )}
      </>
    ),
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine</strong> est un service gratuit du Ministère de la transition écologique qui vous permet d’être{' '}
          <strong>mis en relation avec le gestionnaire</strong> du réseau le plus proche de chez vous{' '}
          <strong>afin d’en savoir plus et de bénéficier d’une première estimation tarifaire gratuite et sans engagement.</strong>
        </p>
        <p>
          <strong>Il vous suffit pour cela de déposer vos coordonnées ci-dessous.</strong>
        </p>
      </>
    ),
  };

  // rue des hirondelles 76610 le havre
  const intermediateFuturCollectif: EligibilityResult = {
    body: ({ distance, inPDP, gestionnaire, tauxENRR, city }) => (
      <>
        <ArrowItem>
          <strong>
            Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur, toutefois un réseau passera prochainement dans les
            environs
          </strong>{' '}
          {distance ? `(${distance})` : ''} (réseau prévu ou en construction).
        </ArrowItem>
        {inPDP && <ObligationsRaccordementLink proche />}
        <ArrowItem>
          Avec un chauffage collectif, <strong>votre immeuble dispose déjà des équipements nécessaires</strong> : il s’agit du cas le plus
          favorable pour un raccordement&nbsp;!
        </ArrowItem>
        {gestionnaire && (
          <ArrowItem>
            Le gestionnaire du futur réseau le plus proche est <strong>{gestionnaire}</strong>.
            {tauxENRR ? (
              <>
                {' '}
                Le taux d’énergies renouvelables et de récupération du réseau sera de <strong>{tauxENRR}%</strong>.
              </>
            ) : null}
          </ArrowItem>
        )}

        {city === 'Paris' && <p className="fr-text--sm">A noter: sur Paris, la puissance souscrite doit être d’au moins 100&nbsp;kW.</p>}
      </>
    ),
    eligibility: true,
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine</strong> est un service gratuit du Ministère de la transition écologique qui vous permet d’être{' '}
          <strong>mis en relation avec le gestionnaire</strong> du réseau le plus proche{' '}
          <strong>
            afin de vérifier la faisabilité du raccordement et de bénéficier d’une première estimation tarifaire gratuite et sans
            engagement.
          </strong>
        </p>
        <p>
          <strong>Il vous suffit pour cela de déposer vos coordonnées ci-dessous.</strong>
        </p>
      </>
    ),
  };

  // rue des hirondelles 76610 le havre
  const closeFuturIndividual: EligibilityResult = {
    body: ({ distance }) => (
      <>
        <ArrowItem>
          <strong>Votre immeuble est situé à proximité</strong> immédiate d’un réseau de chaleur en projet ou en construction{' '}
          {distance ? `(${distance})` : ''}.
        </ArrowItem>
        <ArrowItem>
          Toutefois au vu de votre chauffage actuel,{' '}
          <strong>le raccordement de votre immeuble nécessiterait des travaux conséquents</strong> et coûteux, avec notamment la création
          d’un réseau interne de distribution au sein de l’immeuble.
        </ArrowItem>
        <AutreSolutionsChauffageItem />
        {FranceRenovItem}
      </>
    ),
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine</strong> est un service gratuit du Ministère de la transition écologique qui vous permet de
          découvrir <strong>instantanément</strong> si un réseau passe près de chez vous
        </p>
        <p>
          Votre situation n’est pas favorable{' '}
          <strong>pour un raccordement, mais si vous souhaitez tout de même en savoir plus ou faire connaître votre demande</strong>,
          laissez-nous vos coordonnées pour que nous les transmettions à votre collectivité ou au{' '}
          <strong>gestionnaire du réseau le plus proche.</strong>
        </p>
      </>
    ),
  };

  const noTraceCollectif: EligibilityResult = {
    body: ({ gestionnaire, tauxENRR, isClasse, city }) => (
      <>
        <ArrowItem>
          Il existe un réseau de chaleur sur cette commune, mais nous ne disposons d’aucune information sur sa localisation.
        </ArrowItem>
        {isClasse && ReseauClasseItem}
        <ArrowItem>
          Avec un chauffage collectif, <strong>votre immeuble dispose déjà des équipements nécessaires</strong> : il s’agit du cas le plus
          favorable pour un raccordement&nbsp;!
        </ArrowItem>
        {gestionnaire && (
          <ArrowItem>
            Le gestionnaire du réseau le plus proche est <strong>{gestionnaire}</strong>.
            {tauxENRR ? (
              <>
                {' '}
                Le taux d’énergies renouvelables et de récupération du réseau est de <strong>{tauxENRR}%</strong>.
              </>
            ) : null}
          </ArrowItem>
        )}
        {city === 'Paris' && <p className="fr-text--sm">A noter: sur Paris, la puissance souscrite doit être d’au moins 100&nbsp;kW.</p>}
      </>
    ),
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine</strong> est un service gratuit du Ministère de la transition écologique qui vous permet d’être{' '}
          <strong>mis en relation avec le gestionnaire</strong> du réseau le plus proche{' '}
          <strong>
            afin de vérifier la faisabilité du raccordement et de bénéficier d’une première estimation tarifaire gratuite et sans
            engagement.
          </strong>
        </p>
        <p>
          <strong>Il vous suffit pour cela de déposer vos coordonnées ci-dessous.</strong>
        </p>
      </>
    ),
  };

  const noTraceIndividual: EligibilityResult = {
    body: () => (
      <>
        <ArrowItem>
          Il existe un réseau de chaleur sur cette commune, mais nous ne disposons d’aucune information sur sa localisation.
        </ArrowItem>
        <ArrowItem>
          Au vu de votre chauffage actuel, <strong>le raccordement de votre immeuble nécessiterait des travaux conséquents</strong> et
          coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.
        </ArrowItem>
        <AutreSolutionsChauffageItem />
        {FranceRenovItem}
      </>
    ),
    text: (
      <>
        <p>
          <strong>France Chaleur Urbaine</strong> est un service gratuit du Ministère de la transition écologique qui vous permet de
          découvrir <strong>instantanément</strong> si un réseau passe près de chez vous
        </p>
        <p>
          Votre situation n’est pas favorable{' '}
          <strong>pour un raccordement, mais si vous souhaitez tout de même en savoir plus ou faire connaître votre demande</strong>,
          laissez-nous vos coordonnées pour que nous les transmettions à votre collectivité ou au{' '}
          <strong>gestionnaire du réseau le plus proche.</strong>
        </p>
      </>
    ),
  };

  switch (state) {
    case 'closeFuturCollectif': {
      return closeFuturCollectif;
    }
    case 'closeCollectif': {
      return closeCollectif;
    }
    case 'closeFuturIndividual': {
      return closeFuturIndividual;
    }
    case 'closeIndividual': {
      return closeIndividual;
    }
    case 'intermediateFuturCollectif': {
      return intermediateFuturCollectif;
    }
    case 'intermediateCollectif': {
      return intermediateCollectif;
    }
    case 'farIndividual': {
      return farIndividual;
    }
    case 'farCollectifInPDP': {
      return farCollectifInPDP;
    }
    case 'farCollectifOutPDP': {
      return farCollectifOutPDP;
    }
    case 'unknown': {
      return {} as any;
    }
    case 'noTraceCollectif': {
      return noTraceCollectif;
    }
    case 'noTraceIndividual': {
      return noTraceIndividual;
    }
  }
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
