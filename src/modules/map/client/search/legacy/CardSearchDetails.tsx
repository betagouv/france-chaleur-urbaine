import Badge from '@codegouvfr/react-dsfr/Badge';
import { Button } from '@codegouvfr/react-dsfr/Button';
import { memo, useCallback, useMemo } from 'react';

import Box from '@/components/ui/Box';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import useEligibilityForm from '@/hooks/useEligibilityForm';
import { getReadableDistance } from '@/modules/geo/client/helpers';
import type { Point } from '@/types/Point';
import type { StoredAddress } from '@/types/StoredAddress';

import { ContactFormButtonWrapper, ContactFormWrapper, MessageConfirmBox, SearchedAddress } from './CardSearchDetails.style';

type CardSearchDetailsProps = {
  address: StoredAddress;
  onClick: (result: StoredAddress) => void;
  onClickClose: (result: { coordinates?: Point }) => void;
  onContacted: (result: { coordinates?: Point }) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

const CardSearchDetails = memo(
  function CardSearchDetails({
    address: storedAddress,
    onClick,
    onClickClose,
    onContacted,
    expanded,
    setExpanded,
  }: CardSearchDetailsProps) {
    const { basedOnCity, distance, isEligible, futurNetwork, inPDP, cityHasNetwork, cityHasFuturNetwork, hasNoTraceNetwork } =
      storedAddress.addressDetails?.network || {};
    const markAddressAsContacted = useCallback(() => onContacted(storedAddress), [onContacted, storedAddress]);

    const {
      isVisible: contactFormVisible,
      open: displayContactForm,
      EligibilityFormModal,
    } = useEligibilityForm({
      address: storedAddress,
      context: 'carte',
      id: `contact-form-modal-${storedAddress.id}`,
      onSubmit: markAddressAsContacted,
    });

    const readableDistance = useMemo(() => getReadableDistance(distance), [distance]);

    const eligibilityWording = useMemo(() => {
      if (basedOnCity) {
        if (cityHasNetwork) {
          return 'Un réseau de chaleur passe dans cette ville : renseignez une adresse pour pouvoir être mis en relation avec le gestionnaire du réseau.';
        }

        if (cityHasFuturNetwork) {
          return 'Un réseau de chaleur passera bientôt dans cette ville : renseignez une adresse pour pouvoir être mis en relation avec le gestionnaire du réseau.';
        }

        return "Il n'y a pour le moment pas de réseau de chaleur dans cette ville";
      }

      if ((isEligible && distance === null) || (distance !== null && distance < 100)) {
        const baseMessage = futurNetwork
          ? 'Bonne nouvelle ! Un réseau de chaleur passera bientôt à proximité de cette adresse (prévu ou en construction).'
          : 'Bonne nouvelle ! Un réseau de chaleur passe à proximité de cette adresse.';
        return inPDP ? (
          <>
            {baseMessage}
            <br />
            Votre bâtiment est situé dans le périmètre de développement prioritaire du réseau : une obligation de raccordement peut
            s’appliquer en cas de renouvellement de votre mode de chauffage.
          </>
        ) : (
          baseMessage
        );
      }
      if (distance !== null && distance < 200) {
        const baseMessage = futurNetwork
          ? 'Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur, toutefois un réseau passera prochainement dans les environs (prévu ou en construction).'
          : 'Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur, toutefois le réseau n’est pas très loin.';
        return inPDP ? (
          <>
            {baseMessage}
            <br />
            Votre bâtiment est situé dans le périmètre de développement prioritaire du réseau : une obligation de raccordement peut
            s’appliquer en cas de renouvellement de votre mode de chauffage.
          </>
        ) : (
          baseMessage
        );
      }
      if (hasNoTraceNetwork) {
        return "Il existe un réseau de chaleur sur cette commune, mais nous ne disposons d'aucune information sur sa localisation.";
      }
      return (
        inPDP && (
          <>
            Votre bâtiment est situé dans le périmètre de développement prioritaire du réseau : le réseau se développe et une obligation de
            raccordement peut s’appliquer en cas de renouvellement de votre mode de chauffage.
          </>
        )
      );
    }, [basedOnCity, cityHasNetwork, cityHasFuturNetwork, distance, isEligible, futurNetwork, inPDP]);

    const onClickHandler = useCallback(
      () => (typeof onClick === 'function' && onClick(storedAddress)) || undefined,
      [onClick, storedAddress]
    );

    const onCloseHandler = useCallback(
      (evt: React.MouseEvent<HTMLElement>) => {
        evt.stopPropagation();
        onClickClose(storedAddress);
      },
      [onClickClose, storedAddress]
    );

    const isReseauClose = basedOnCity ? cityHasFuturNetwork || cityHasNetwork : isEligible;

    return (
      <>
        <EligibilityFormModal />
        <SearchedAddress
          expanded={expanded}
          onExpandedChange={(newExpanded) => {
            setExpanded(newExpanded);
            onClickHandler();
          }}
          onClose={onCloseHandler}
          small
          bordered
          label={
            <div className="searched-address-label">
              <div className="mb-0.5">
                {isReseauClose ? (
                  <Badge small severity="success">
                    Réseau proche
                  </Badge>
                ) : (
                  <Badge small severity="error">
                    Pas de réseau connu
                  </Badge>
                )}
              </div>
              <div className="text-base">{storedAddress.address}</div>
            </div>
          }
        >
          <section>
            {basedOnCity ? (
              eligibilityWording
            ) : (
              <>
                <div className="fr-mb-2w">
                  {eligibilityWording}
                  {readableDistance && (
                    <Box textColor="text-label-blue-france" display="flex" alignItems="center" gap="4px">
                      {readableDistance && (
                        <span>
                          {futurNetwork ? 'passera à' : ''} {readableDistance}
                          {!isReseauClose && <span className="text-black"> : pas de réseau de chaleur à proximité</span>}
                        </span>
                      )}
                    </Box>
                  )}
                </div>
                {!contactFormVisible && storedAddress.contacted ? (
                  <MessageConfirmBox>
                    <Icon name="fr-icon-success-fill" size="lg" color="#78EB7B" />
                    Demande envoyée
                  </MessageConfirmBox>
                ) : (
                  <ContactFormWrapper>
                    {!storedAddress.contacted && (
                      <>
                        <header className="mb-0">
                          {isEligible ? (
                            'Vous souhaitez en savoir plus ?'
                          ) : (
                            <>
                              <strong>Et maintenant ?</strong>
                              <p className="font-normal my-3v">
                                Signalez au gestionnaire du réseau le plus proche ou à la collectivité votre souhait de raccordement, et
                                découvrez d’autres solutions de chauffage écologiques adaptées à votre bâtiment :
                              </p>
                            </>
                          )}
                        </header>
                        <ContactFormButtonWrapper>
                          <Button
                            iconId="fr-icon-mail-line"
                            iconPosition="right"
                            onClick={displayContactForm}
                            className="w-full justify-center"
                          >
                            {isEligible ? 'Être mis en relation avec le gestionnaire du réseau' : 'Laissez vos coordonnées'}
                          </Button>
                        </ContactFormButtonWrapper>
                        {!isEligible && (
                          <Link
                            href={`/chaleur-renouvelable?adresse=${encodeURIComponent(storedAddress.addressDetails.geoAddress?.properties.label ?? storedAddress.address)}`}
                            variant="secondary"
                            className="w-full mt-3v fr-btn--icon-right fr-icon-arrow-right-line justify-center"
                            postHogEventKey="address_test:discover_more_clicked"
                            postHogEventProps={{ result_type: 'non eligible', source: 'carte' }}
                          >
                            Découvrir d'autres solutions
                          </Link>
                        )}
                      </>
                    )}
                  </ContactFormWrapper>
                )}
              </>
            )}
          </section>
        </SearchedAddress>
      </>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.address === nextProps.address &&
      prevProps.expanded === nextProps.expanded &&
      prevProps.onClick === nextProps.onClick &&
      prevProps.onClickClose === nextProps.onClickClose &&
      prevProps.onContacted === nextProps.onContacted &&
      prevProps.setExpanded === nextProps.setExpanded
    );
  }
);

export default CardSearchDetails;
