import MarkdownWrapper from '@components/MarkdownWrapper';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { AddressDataType, AvailableHeating } from 'src/types/AddressData';
import { HeatNetworksResponse } from 'src/types/HeatNetworksResponse';
import {
  ContactForm,
  ContactFormContentWrapper,
  ContactFormEligibilityMessage,
  ContactFormResultMessage,
  ContactFormWrapper,
} from './components';

type EligibilityFormContactType = {
  addressData: AddressDataType;
  isSent?: boolean;
  cardMode?: boolean;
  onSubmit?: (...arg: any) => void;
};

type KeyPrimaryType =
  | 'lt100'
  | 'lt200'
  | 'gt200'
  | 'provinceElligible'
  | 'provinceIneligible'
  | undefined;

const bordeauxMetropoleCityCodes = [
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

export const getContactResult = (
  heatingType: AvailableHeating,
  eligibility?: HeatNetworksResponse
) => {
  let keyPrimary: KeyPrimaryType = 'gt200';
  if (eligibility) {
    if (eligibility.isBasedOnIris) {
      keyPrimary = eligibility.isEligible
        ? 'provinceElligible'
        : 'provinceIneligible';
    } else if (eligibility.distance !== null) {
      if (eligibility.distance <= 100) {
        keyPrimary = 'lt100';
      } else if (eligibility.distance <= 200) {
        keyPrimary = 'lt200';
      }
    }
  }

  return (
    (keyPrimary && heatingType && formContactResult[keyPrimary][heatingType]) ||
    {}
  );
};

const formContactResult: Record<string, Record<string, any>> = {
  lt100: {
    collectif: {
      eligibility: true,
      header: `**Bonne nouvelle ! Un réseau de chaleur passe à proximité de votre adresse.**`,
      futurHeader: `**Bonne nouvelle ! Un réseau de chaleur passera bientôt à proximité de cette adresse (prévu ou en construction).**`,
      body: `
Au vu de votre chauffage actuel, votre immeuble dispose déjà des équipements nécessaires : **il s’agit du cas le plus favorable pour un raccordement !**  

**Laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche afin de bénéficier d’une **première estimation tarifaire gratuite et sans engagement.**`,
      headerTypo: 'large',
    },
    individuel: {
      eligibility: false,
      header: `Votre immeuble est situé à proximité immédiate d’un réseau de chaleur, toutefois **au vu de votre chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux**, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.`,
      futurHeader: `Un réseau de chaleur passera bientôt à proximité de votre adresse (prévu ou en construction), toutefois au vu de votre chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.`,
      body: `
Si vous souhaitez tout de même en savoir plus, **laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche.  

L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [France Rénov’](https://france-renov.gouv.fr/)  

Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage) `,
      bodyLight: `
Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble`,
      headerTypo: 'small',
    },
  },
  lt200: {
    collectif: {
      eligibility: true,
      header: `**Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur, toutefois le réseau n’est pas très loin.**`,
      futurHeader: `**Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur, toutefois un réseau passera prochainement dans les environs (prévu ou en construction).**`,
      body: `
Au vu de votre chauffage actuel, votre immeuble dispose déjà des équipements nécessaires : **il s’agit du cas le plus favorable pour un raccordement !**  

**Laissez-nous vos coordonnées pour être recontacté par le gestionnaire du réseau le plus proche afin de vérifier la faisabilité technique et économique d’un raccordement (gratuit et sans engagement).**`,
      headerTypo: 'large',
    },
    individuel: {
      eligibility: false,
      header: `Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur et **au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux,** avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.`,
      body: `
Si vous souhaitez tout de même en savoir plus, **laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche.  

L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [France Rénov’](https://france-renov.gouv.fr/)  

Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage) `,
      bodyLight: `
Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble`,
      headerTypo: 'small',
    },
  },
  gt200: {
    collectif: {
      eligibility: false,
      header: `Il n’existe pour le moment pas de réseau de chaleur à proximité de votre adresse, **toutefois les réseaux de chaleur se développent !**`,
      body: `
**Contribuez au développement des réseaux de chaleur** en faisant connaître votre souhait de vous raccorder ! **Laissez-nous vos coordonnées pour être tenu informé** par le gestionnaire du réseau le plus proche ou par votre collectivité des projets d’extension de réseau ou de création de réseau dans votre quartier.  

Sans attendre, pour réduire votre facture énergétique et limiter votre impact écologique, pensez à améliorer l’isolation thermique de votre immeuble. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [France Rénov’](https://france-renov.gouv.fr/)`,
      headerTypo: 'large',
    },
    individuel: {
      eligibility: false,
      header: `Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur et **au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux,** avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.`,
      body: `
Si vous souhaitez tout de même en savoir plus, **laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche.  

L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [France Rénov’](https://france-renov.gouv.fr/)  

Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage) `,
      bodyLight: `
Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble`,
      headerTypo: 'small',
    },
  },
  provinceElligible: {
    collectif: {
      eligibility: true,
      header: `**Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur, toutefois le réseau n’est pas très loin.**`,
      body: `
Au vu de votre chauffage actuel, votre immeuble dispose déjà des équipements nécessaires : **il s’agit du cas le plus favorable pour un raccordement !**  

**Laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche afin de bénéficier d’une **première estimation tarifaire gratuite et sans engagement.**`,
      headerTypo: 'large',
    },
    individuel: {
      eligibility: false,
      header: `Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur et **au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux,** avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.`,
      body: `
Si vous souhaitez tout de même en savoir plus, **laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche.  

L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [France Rénov’](https://france-renov.gouv.fr/)  

Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage) `,
      bodyLight: `
Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble`,
      headerTypo: 'small',
    },
  },
  provinceIneligible: {
    collectif: {
      eligibility: false,
      header: `Il n’existe pour le moment pas de réseau de chaleur à proximité de votre adresse, **toutefois les réseaux de chaleur se développent !**`,
      body: `
**Contribuez au développement des réseaux de chaleur** en faisant connaître votre souhait de vous raccorder ! **Laissez-nous vos coordonnées pour être tenu informé** par le gestionnaire du réseau le plus proche ou par votre collectivité des projets d’extension de réseau ou de création de réseau dans votre quartier.  

Sans attendre, pour réduire votre facture énergétique et limiter votre impact écologique, pensez à améliorer l’isolation thermique de votre immeuble. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [France Rénov’](https://france-renov.gouv.fr/)`,
      bodyLight: `
Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble`,
      headerTypo: 'large',
    },
    individuel: {
      eligibility: false,
      header: `Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur et **au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux,** avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.`,
      body: `
Si vous souhaitez tout de même en savoir plus, **laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche.  

L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [France Rénov’](https://france-renov.gouv.fr/)  

Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage) `,
      bodyLight: `
Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble`,
      headerTypo: 'small',
    },
  },
};

const EligibilityFormContact = ({
  addressData,
  isSent,
  cardMode,
  onSubmit,
}: EligibilityFormContactType) => {
  const {
    distance,
    futurNetwork,
    header,
    futurHeader,
    body,
    bodyLight,
    computedEligibility,
    headerTypo,
  } = useMemo(() => {
    const {
      header,
      futurHeader,
      body,
      bodyLight,
      eligibility: computedEligibility,
      headerTypo,
    }: any = getContactResult(addressData.heatingType, addressData.eligibility);

    const addBordeauxLink =
      addressData.geoAddress?.properties.citycode &&
      bordeauxMetropoleCityCodes.includes(
        addressData.geoAddress?.properties.citycode
      );

    return {
      distance: addressData.eligibility?.distance,
      futurNetwork: addressData.eligibility?.futurNetwork,
      header,
      futurHeader,
      body: addBordeauxLink
        ? (body as string).replace(
            '[France Rénov’](https://france-renov.gouv.fr/)',
            '[France Rénov’](https://france-renov.gouv.fr/) et [Bordeaux Métropole](https://www.bordeaux-metropole.fr/)'
          )
        : body,
      bodyLight,
      computedEligibility,
      headerTypo,
    };
  }, [addressData]);

  const handleSubmitForm = useCallback(
    async (values: Record<string, string | number>) => {
      const sendedValues: any = {
        ...addressData,
        ...values,
        computedEligibility,
      };
      if (addressData?.geoAddress?.properties) {
        sendedValues.city = addressData.geoAddress.properties.city;
        sendedValues.postcode = addressData.geoAddress.properties.postcode;
        const context = addressData.geoAddress.properties.context.split(',');
        sendedValues.department = (context[1] || '').trim();
        sendedValues.region = (context[2] || '').trim();
      }

      if (onSubmit) {
        onSubmit(sendedValues);
      }
    },
    [addressData, computedEligibility, onSubmit]
  );

  const readableDistance = useMemo(() => {
    if (distance === null || distance === undefined) {
      return '';
    }

    if (distance < 1) {
      return '< 1m';
    }
    if (distance >= 1000) {
      return `${distance / 1000}km`;
    }
    return `${distance}m`;
  }, [distance]);

  const linkToMap =
    addressData?.geoAddress?.geometry?.coordinates &&
    (!addressData.eligibility?.isBasedOnIris
      ? `./carte/?coord=${addressData.geoAddress.geometry.coordinates}&zoom=15`
      : `https://carto.viaseva.org/public/viaseva/map/?coord=${addressData.geoAddress.geometry.coordinates.reverse()}&zoom=15`);

  return (
    <ContactFormWrapper cardMode={cardMode}>
      <ContactFormContentWrapper cardMode={cardMode}>
        {!cardMode ? (
          <>
            <ContactFormResultMessage
              eligible={computedEligibility}
              headerTypo={headerTypo}
            >
              <MarkdownWrapper
                value={futurNetwork && futurHeader ? futurHeader : header}
              />
              {readableDistance && (
                <em className="distance">
                  Un réseau de chaleur se {futurNetwork ? 'trouvera' : 'trouve'}{' '}
                  à {readableDistance} de ce bâtiment
                </em>
              )}
              {!computedEligibility && linkToMap && (
                <Link href={linkToMap}>
                  <a
                    target="_blank"
                    className="fr-text--sm"
                    rel="noopener noreferrer"
                  >
                    Visualiser les réseaux à proximité de cette adresse
                  </a>
                </Link>
              )}
            </ContactFormResultMessage>
            <ContactFormEligibilityMessage cardMode>
              <MarkdownWrapper value={body} />
            </ContactFormEligibilityMessage>
          </>
        ) : (
          bodyLight && (
            <ContactFormResultMessage
              eligible={computedEligibility}
              headerTypo={headerTypo}
              cardMode
            >
              <MarkdownWrapper value={bodyLight} />
            </ContactFormResultMessage>
          )
        )}
      </ContactFormContentWrapper>

      <ContactFormContentWrapper cardMode={cardMode}>
        <ContactForm
          onSubmit={handleSubmitForm}
          isLoading={isSent}
          cardMode={cardMode}
        />
      </ContactFormContentWrapper>
    </ContactFormWrapper>
  );
};

export default EligibilityFormContact;
