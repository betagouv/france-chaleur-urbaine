import Map from '@components/Map/Map';
import MarkdownWrapper from '@components/MarkdownWrapper';
import { Alert } from '@dataesr/react-dsfr';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';
import { getReadableDistance } from 'src/services/Map/distance';
import { AddressDataType } from 'src/types/AddressData';
import {
  bordeauxMetropoleCityCodes,
  getEligibilityResult,
} from './ElgibilityResults';
import {
  ContactForm,
  ContactFormContentWrapper,
  ContactFormResultMessage,
  ContactFormWrapper,
  ContactMapResult,
} from './components';

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
  const { body, computedEligibility, text } = useMemo(() => {
    if (!addressData.eligibility) {
      return {};
    }

    const {
      header,
      body,
      eligibility: computedEligibility,
      text,
    }: any = getEligibilityResult(
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
          addressData.eligibility.tauxENRR
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

  return (
    <ContactFormWrapper cardMode={cardMode}>
      <ContactFormContentWrapper cardMode={cardMode}>
        {!cardMode ? (
          <>
            <ContactFormResultMessage eligible={computedEligibility}>
              <MarkdownWrapper value={body} />
            </ContactFormResultMessage>
            <ContactMapResult>
              <Map
                withoutLogo
                center={
                  addressData.coords && [
                    addressData.coords.lon,
                    addressData.coords.lat,
                  ]
                }
                initialLayerDisplay={{
                  outline: true,
                  futurOutline: true,
                  coldOutline: false,
                  zoneDP: true,
                  demands: false,
                  raccordements: false,
                  gasUsageGroup: false,
                  buildings: false,
                  gasUsage: [],
                  energy: [],
                  gasUsageValues: [1000, Number.MAX_VALUE],
                  energyGasValues: [50, Number.MAX_VALUE],
                  energyFuelValues: [50, Number.MAX_VALUE],
                }}
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

      <ContactFormContentWrapper cardMode={cardMode}>
        {!cardMode && (
          <>
            <Image
              src="/img/logo_rf.png"
              alt="logo france chaleur urbaine"
              width={50}
              height={45}
            />
            <MarkdownWrapper value={text} />
          </>
        )}
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
