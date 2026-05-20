import { Alert } from '@codegouvfr/react-dsfr/Alert';
import { useCallback, useMemo, useState } from 'react';

import Box from '@/components/ui/Box';
import Image from '@/components/ui/Image';
import Link from '@/components/ui/Link';
import type { ContactFormInfos } from '@/modules/demands/constants';
import { getReadableDistance } from '@/modules/geo/client/helpers';
import { createMapConfiguration } from '@/modules/map/client/config/map-configuration';
import { MapMarker } from '@/modules/map/client/interactions/MapMarker';
import { Map } from '@/modules/map/client/Map';
import trpc from '@/modules/trpc/client';
import type { AddressDataType } from '@/types/AddressData';

import { ContactForm, ContactFormContentWrapper, ContactFormResultMessage, ContactFormWrapper, ContactMapResult } from './components';
import { getEligibilityResult } from './EligibilityResults';

type EligibilityFormContactType = {
  addressData: AddressDataType;
  cardMode?: boolean;
  onSubmit?: (...arg: any) => Promise<any>;
  className?: string;
};

const EligibilityFormContact = ({ addressData, cardMode, onSubmit, className }: EligibilityFormContactType) => {
  const trpcUtils = trpc.useUtils();
  const [contactFormState, setContactFormState] = useState('');

  const { title, body, computedEligibility, display, text } = useMemo(() => {
    if (!addressData.eligibility) {
      return {};
    }

    const {
      title,
      body,
      eligibility: computedEligibility,
      display,
      text,
    } = getEligibilityResult(addressData.address || '', addressData.heatingType, addressData.eligibility);

    const distance = getReadableDistance(addressData.eligibility.distance);
    const computedTitle = title ? title({ distance }) : '';
    const computedBody = body
      ? body({
          city: addressData.geoAddress?.properties.city,
          distance,
          gestionnaire: addressData.eligibility.gestionnaire?.trim() || null,
          hasPDP: addressData.eligibility.hasPDP,
          inPDP: addressData.eligibility.inPDP,
          isClasse: addressData.eligibility.isClasse,
          tauxENRR: addressData.eligibility.tauxENRR,
        })
      : '';

    return {
      body: computedBody,
      computedEligibility,
      display,
      text,
      title: computedTitle,
    };
  }, [addressData]);

  const handleSubmitForm = useCallback(
    async (values: ContactFormInfos) => {
      try {
        setContactFormState('loading');

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

        const shouldCreateDemand = display !== 'collectContact' || values.acceptGestionnaire;

        if (display === 'collectContact') {
          await trpcUtils.client.demands.user.createFCUTeamContact.mutate({
            ...values,
            address: sendedValues.address,
          });
          setContactFormState(!shouldCreateDemand ? 'success' : '');
        }

        if (onSubmit && shouldCreateDemand) {
          await onSubmit(sendedValues).finally(() => {
            setContactFormState('');
          });
          return;
        }
      } catch (_err) {
        setContactFormState('error');
      }
    },
    [addressData, computedEligibility, display, onSubmit, trpcUtils]
  );

  const addressCoordinates = addressData.geoAddress?.geometry.coordinates;
  const mapConfig = createMapConfiguration({
    reseauxDeChaleur: { show: true },
    reseauxEnConstruction: true,
    zonesDeDeveloppementPrioritaire: true,
  });

  return (
    <ContactFormWrapper cardMode={cardMode} className={className}>
      {addressData.eligibility?.basedOnCity && !cardMode ? (
        <ContactFormContentWrapper>
          <ContactFormResultMessage eligible={addressData.eligibility?.cityHasNetwork || addressData.eligibility?.cityHasFuturNetwork}>
            {addressData.eligibility?.cityHasNetwork
              ? 'Un réseau de chaleur passe dans cette ville : renseignez une adresse pour pouvoir être mis en relation avec le gestionnaire du réseau.'
              : addressData.eligibility?.cityHasFuturNetwork
                ? 'Un réseau de chaleur passera bientôt dans cette ville : renseignez une adresse pour pouvoir être mis en relation avec le gestionnaire du réseau.'
                : "Il n'y a pour le moment pas de réseau de chaleur dans cette ville"}
          </ContactFormResultMessage>
          <ContactMapResult>
            <Map config={mapConfig} initialView={addressCoordinates ? { center: addressCoordinates, zoom: 16 } : undefined}>
              {addressCoordinates && <MapMarker longitude={addressCoordinates[0]} latitude={addressCoordinates[1]} color="#4550e5" />}
            </Map>
          </ContactMapResult>
        </ContactFormContentWrapper>
      ) : (
        <>
          <ContactFormContentWrapper>
            {!cardMode ? (
              <>
                <ContactFormResultMessage eligible={computedEligibility}>
                  {title && <h2 className="fr-h6">{title}</h2>}
                  {body}
                </ContactFormResultMessage>
                <ContactMapResult>
                  <Map config={mapConfig} initialView={addressCoordinates ? { center: addressCoordinates, zoom: 16 } : undefined}>
                    {addressCoordinates && <MapMarker longitude={addressCoordinates[0]} latitude={addressCoordinates[1]} color="#4550e5" />}
                  </Map>
                </ContactMapResult>
              </>
            ) : (
              addressData.heatingType === 'individuel' && (
                <Alert
                  className="fr-mt-2w"
                  severity="warning"
                  small
                  description="Au vu de votre mode de chauffage actuel, le raccordement de votre immeuble nécessiterait des travaux conséquents et coûteux, avec notamment la création d’un réseau interne de distribution au sein de l’immeuble"
                />
              )
            )}
          </ContactFormContentWrapper>
          <ContactFormContentWrapper>
            {!cardMode && (
              <>
                <Image src="/logo-rf.svg" alt="logo République française" width={66} height={58} className="fr-mb-3v" />
                <div className="h4-dark-blue">{text}</div>
              </>
            )}
            <ContactForm
              display={display}
              city={addressData.geoAddress?.properties.city}
              onSubmit={handleSubmitForm}
              isLoading={contactFormState === 'loading'}
              cardMode={cardMode}
            />
            {contactFormState === 'error' && (
              <Box textColor="#c00" mt="1w">
                Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
              </Box>
            )}
            {contactFormState === 'success' && (
              <Alert
                className="fr-mt-2w"
                severity="success"
                small
                description="Merci, votre demande a bien été envoyée. Notre équipe reviendra vers vous prochainement."
              />
            )}
          </ContactFormContentWrapper>
        </>
      )}
    </ContactFormWrapper>
  );
};

export default EligibilityFormContact;
