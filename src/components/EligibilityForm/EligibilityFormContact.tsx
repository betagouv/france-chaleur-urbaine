import {
  ContactFormContentWrapper,
  ContactFormEligibilityMessage,
  ContactFormResultMessage,
  ContactFormWrapper,
} from '@components/EligibilityForm/components/EligibilityForm.styled';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { isIDF } from '@helpers';
import React, { useCallback, useMemo } from 'react';
import ContactForm from './components/ContactForm';

// TODO: Extract and import
type AvailableHeating = 'collectif' | 'individuel' | undefined;
type AddressDataType = {
  geoAddress?: Record<string, any>;
  eligibility?: boolean;
  heatingType?: AvailableHeating;
  network?: Record<string, any>;
  distance?: number;
};

type EligibilityFormContactType = {
  addressData: AddressDataType;
  onSubmit?: (...arg: any) => void;
};

type KeyPrimaryType =
  | 'lt100'
  | 'lt200'
  | 'gt200'
  | 'provinceElligible'
  | 'provinceIneligible'
  | undefined;

const getContactResult = (
  formContactResult: Record<string, Record<string, string>>,
  { distance, eligibility, heatingType }: AddressDataType
) => {
  const keyPrimary: KeyPrimaryType =
    (distance !== null &&
      distance !== undefined &&
      (distance <= 100 ? 'lt100' : distance <= 200 ? 'lt200' : 'gt200')) ||
    (eligibility ? 'provinceElligible' : 'provinceIneligible');
  const keySecondary: AvailableHeating = heatingType;
  return (
    (keyPrimary &&
      keySecondary &&
      formContactResult?.[keyPrimary]?.[keySecondary]) ||
    {}
  );
};

const formContactResult: Record<string, Record<string, any>> = {
  lt100: {
    collectif: {
      eligibility: true,
      header: `**Bonne nouvelle ! Un réseau de chaleur passe à proximité de votre adresse.**`,
      body: `
Au vu de votre chauffage actuel, votre immeuble dispose déjà des équipements nécessaires : **il s’agit du cas le plus favorable pour un raccordement !**  

**Laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche afin de bénéficier d’une **première estimation tarifaire gratuite et sans engagement.**`,
      headerTypo: 'large',
    },
    individuel: {
      eligibility: false,
      header: `Votre immeuble est situé à proximité immédiate d’un réseau de chaleur, toutefois **au vu de votre chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux**, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble`,
      body: `
Si vous souhaitez tout de même en savoir plus, **laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche.  

L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [France Rénov’](https://france-renov.gouv.fr/)  

Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage) `,
      headerTypo: 'small',
    },
  },
  lt200: {
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
      headerTypo: 'large',
    },
    individuel: {
      eligibility: false,
      header: `Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur et **au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux,** avec notamment la création d’un réseau interne de distribution au sein de l’immeuble.`,
      body: `
Si vous souhaitez tout de même en savoir plus, **laissez-nous vos coordonnées** pour être recontacté par le gestionnaire du réseau le plus proche.  

L’amélioration de l’isolation thermique de votre immeuble constitue un autre levier pour réduire votre facture énergétique et limiter votre impact écologique. Pour être accompagné dans vos projets de rénovation énergétique, rendez-vous sur [France Rénov’](https://france-renov.gouv.fr/)  

Découvrez également d’autres solutions de chauffage [ici](https://france-renov.gouv.fr/renovation/chauffage) `,
      headerTypo: 'small',
    },
  },
};

const EligibilityFormContact = ({
  addressData,
  onSubmit,
}: EligibilityFormContactType) => {
  const isIDFAddress = useMemo(() => {
    const { postcode: postCode } = addressData?.geoAddress?.properties || {};
    return postCode && isIDF(postCode);
  }, [addressData]);

  const addressCoords: [number, number] | undefined = useMemo(() => {
    const [lon, lat] = addressData?.geoAddress?.geometry?.coordinates || [];
    return lat && lon ? [lat, lon] : undefined; // TODO: Fix on source
  }, [addressData]);

  const { distance, header, body, computEligibility, headerTypo } =
    useMemo(() => {
      const {
        heatingType,
        eligibility,
        network = {},
      }: AddressDataType = addressData;
      const { distance } = network || {};
      const {
        header,
        body,
        eligibility: computEligibility,
        headerTypo,
      }: any = getContactResult(formContactResult, {
        distance,
        eligibility,
        heatingType,
      });
      return {
        distance,
        header,
        body,
        computEligibility,
        headerTypo,
      };
    }, [addressData]);

  const handleSubmitForm = useCallback(
    async (values: Record<string, string | number>) => {
      const sendedValues = {
        ...addressData,
        ...values,
        computEligibility,
      };

      if (onSubmit) onSubmit(sendedValues);
    },
    [addressData, computEligibility, onSubmit]
  );

  const distStep =
    isIDFAddress &&
    distance !== null &&
    distance !== undefined &&
    (distance <= 200
      ? `Un reseau de chaleur se trouve à ${distance}m de ce batiment`
      : '');
  const linkToMap =
    addressCoords &&
    (isIDFAddress
      ? `./carte/?coord=${addressCoords}&zoom=15`
      : `https://carto.viaseva.org/public/viaseva/map/?coord=${addressCoords}&zoom=15`);

  return (
    <ContactFormWrapper>
      <ContactFormContentWrapper>
        <ContactFormResultMessage
          eligible={computEligibility}
          headerTypo={headerTypo}
        >
          <MarkdownWrapper value={header} />
          {distance !== null && distance !== undefined && distStep && (
            <em className="distance">{distStep}</em>
          )}
          {!computEligibility && linkToMap && (
            <a
              href={linkToMap}
              target="_blank"
              className="fr-text--sm"
              rel="noopener noreferrer"
            >
              Visualiser les réseaux à proximité de cette adresse
            </a>
          )}
        </ContactFormResultMessage>
        <ContactFormEligibilityMessage>
          <MarkdownWrapper value={body} />
        </ContactFormEligibilityMessage>
      </ContactFormContentWrapper>

      <ContactFormContentWrapper>
        <div>
          <ContactForm onSubmit={handleSubmitForm} />
        </div>
      </ContactFormContentWrapper>
    </ContactFormWrapper>
  );
};

export default EligibilityFormContact;
