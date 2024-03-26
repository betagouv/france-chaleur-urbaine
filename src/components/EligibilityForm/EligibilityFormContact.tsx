import Map from '@components/Map/Map';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { Alert } from '@codegouvfr/react-dsfr';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';
import { getReadableDistance } from 'src/services/Map/distance';
import { AddressDataType } from 'src/types/AddressData';
import {
  bordeauxMetropoleCityCodes,
  getEligibilityResult,
  getEligibilityResultState,
} from './EligibilityResults';
import {
  ContactForm,
  ContactFormContentWrapper,
  ContactFormResultMessage,
  ContactFormWrapper,
  ContactMapResult,
} from './components';
import { createMapConfiguration } from 'src/services/Map/map-configuration';
import { useMatomoAbTestingExperiment } from 'src/services/analytics';

type EligibilityFormContactType = {
  addressData: AddressDataType;
  isSent?: boolean;
  cardMode?: boolean;
  onSubmit?: (...arg: any) => void;
};

const EligibilityFormContact = ({
  addressData,
  isSent,
  cardMode,
  onSubmit,
}: EligibilityFormContactType) => {
  const { ready, variation } = useMatomoAbTestingExperiment(
    'TestMessagesFormulaireContact',
    {
      enable:
        getEligibilityResultState(
          addressData.heatingType,
          addressData.eligibility
        ) === 'closeCollectif',
    }
  );

  const { body, computedEligibility, text } = useMemo(() => {
    if (!addressData.eligibility || !variation) {
      return {};
    }

    const {
      header,
      body,
      eligibility: computedEligibility,
      text,
    }: any = getEligibilityResult(
      variation,
      addressData.heatingType,
      addressData.eligibility
    );

    const addBordeauxLink =
      addressData.geoAddress?.properties.citycode &&
      bordeauxMetropoleCityCodes.includes(
        addressData.geoAddress?.properties.citycode
      );
    const computedBody = body
      ? body(
          getReadableDistance(addressData.eligibility.distance),
          addressData.eligibility.inZDP,
          addressData.eligibility.gestionnaire,
          addressData.eligibility.tauxENRR,
          addressData.geoAddress?.properties.city
        )
      : '';

    return {
      header,
      body: addBordeauxLink
        ? (computedBody as string).replace(
            '[France Rénov’](https://france-renov.gouv.fr/)',
            '[France Rénov’](https://france-renov.gouv.fr/) et [Bordeaux Métropole](https://www.bordeaux-metropole.fr/)'
          )
        : computedBody,
      computedEligibility,
      text,
    };
  }, [addressData, variation]);

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

  if (!ready) {
    return null;
  }
  return (
    <ContactFormWrapper cardMode={cardMode}>
      {addressData.eligibility?.basedOnCity && !cardMode ? (
        <>
          <ContactFormContentWrapper>
            <ContactFormResultMessage
              eligible={
                addressData.eligibility?.cityHasNetwork ||
                addressData.eligibility?.cityHasFuturNetwork
              }
            >
              {addressData.eligibility?.cityHasNetwork
                ? 'Un réseau de chaleur passe dans cette ville : renseignez une adresse pour pouvoir être mis en relation avec le gestionnaire du réseau.'
                : addressData.eligibility?.cityHasFuturNetwork
                ? 'Un réseau de chaleur passera bientôt dans cette ville : renseignez une adresse pour pouvoir être mis en relation avec le gestionnaire du réseau.'
                : "Il n'y a pour le moment pas de réseau de chaleur dans cette ville"}
            </ContactFormResultMessage>
            <ContactMapResult>
              <Map
                withCenterPin
                withoutLogo
                initialCenter={addressData.geoAddress?.geometry.coordinates}
                initialMapConfiguration={createMapConfiguration({
                  reseauxDeChaleur: {
                    show: true,
                  },
                  reseauxEnConstruction: true,
                  zonesDeDeveloppementPrioritaire: true,
                })}
              />
            </ContactMapResult>
          </ContactFormContentWrapper>
        </>
      ) : (
        <>
          <ContactFormContentWrapper>
            {!cardMode ? (
              <>
                <ContactFormResultMessage eligible={computedEligibility}>
                  <MarkdownWrapper value={body} />
                </ContactFormResultMessage>
                <ContactMapResult>
                  <Map
                    withCenterPin
                    withoutLogo
                    initialCenter={addressData.geoAddress?.geometry.coordinates}
                    initialMapConfiguration={createMapConfiguration({
                      reseauxDeChaleur: {
                        show: true,
                      },
                      reseauxEnConstruction: true,
                      zonesDeDeveloppementPrioritaire: true,
                    })}
                  />
                </ContactMapResult>
              </>
            ) : (
              addressData.heatingType === 'individuel' && (
                <Alert
                  className="fr-mt-2w"
                  type="warning"
                  small
                  description="Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble"
                />
              )
            )}
          </ContactFormContentWrapper>
          <ContactFormContentWrapper>
            {!cardMode && (
              <>
                <Image
                  src="/img/logo_rf.png"
                  alt="logo france chaleur urbaine"
                  width={50}
                  height={45}
                />
                <MarkdownWrapper value={text} className="h4-dark-blue" />
              </>
            )}
            <ContactForm
              city={addressData.geoAddress?.properties.city}
              onSubmit={handleSubmitForm}
              isLoading={isSent}
              cardMode={cardMode}
            />
          </ContactFormContentWrapper>
        </>
      )}
    </ContactFormWrapper>
  );
};

export default EligibilityFormContact;
