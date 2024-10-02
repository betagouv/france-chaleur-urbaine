import Badge from '@codegouvfr/react-dsfr/Badge';
import { Button } from '@codegouvfr/react-dsfr/Button';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';

import EligibilityContactFormModal, {
  modal as eligibilityContactFormModal,
  useIsModalOpen,
} from '@components/EligibilityForm/EligibilityContactFormModal';
import Box from '@components/ui/Box';
import Icon from '@components/ui/Icon';
import { getReadableDistance } from 'src/services/Map/distance';
import { Point } from 'src/types/Point';
import { StoredAddress } from 'src/types/StoredAddress';

import { ContactFormButtonWrapper, ContactFormWrapper, MessageConfirmBox, SearchedAddress } from './CardSearchDetails.style';

type CardSearchDetailsProps = {
  address: StoredAddress;
  onClick: (result: StoredAddress) => void;
  onClickClose: (result: { coordinates?: Point }) => void;
  onContacted: (result: { coordinates?: Point }) => void;
  expanded: boolean;
  setExpanded: (expanded: boolean) => void;
};

const CardSearchDetails = ({
  address: storedAddress,
  onClick,
  onClickClose,
  onContacted,
  expanded,
  setExpanded,
}: CardSearchDetailsProps) => {
  const { basedOnCity, distance, isEligible, futurNetwork, inPDP, cityHasNetwork, cityHasFuturNetwork, hasNoTraceNetwork } =
    storedAddress.addressDetails?.network || {};
  const contactFormVisible = useIsModalOpen(eligibilityContactFormModal);

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
      return <>Il existe un réseau de chaleur sur cette commune, mais nous ne disposons d’aucune information sur sa localisation.</>;
    }
    {
      const baseMessage = "D'après nos données, il n'y a pour le moment pas de réseau de chaleur à proximité de cette adresse.";
      return inPDP ? (
        <>
          {baseMessage}
          <br />
          Toutefois, votre bâtiment est situé dans le périmètre de développement prioritaire du réseau : le réseau se développe et une
          obligation de raccordement peut s’appliquer en cas de renouvellement de votre mode de chauffage.
        </>
      ) : (
        baseMessage
      );
    }
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

  const markAddressAsContacted = useCallback(() => onContacted(storedAddress), [onContacted, storedAddress]);

  const displayContactForm = useCallback(() => eligibilityContactFormModal.open(), []);

  const isReseauClose = basedOnCity ? cityHasFuturNetwork || cityHasNetwork : isEligible;

  return (
    <>
      <EligibilityContactFormModal fullAddress={storedAddress} onSubmit={markAddressAsContacted} />
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
          <Box display="flex" alignItems="flex-start" flexDirection="column" gap={'2px'}>
            {isReseauClose ? (
              <Badge small severity="success">
                Réseau proche
              </Badge>
            ) : (
              <Badge small severity="error">
                Pas de réseau connu
              </Badge>
            )}
            <strong>{storedAddress.address}</strong>
          </Box>
        }
      >
        <section>
          {basedOnCity ? (
            eligibilityWording
          ) : (
            <>
              <div>
                {eligibilityWording}
                {readableDistance && (
                  <Box className="fr-my-2w" textColor="text-label-blue-france" display="flex" alignItems="center" gap={'2px'}>
                    <Image src="/icons/grid-line.svg" alt="" height="16" width="16" />
                    {readableDistance && (
                      <span>
                        {futurNetwork ? 'passera' : ''} {readableDistance}
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
                    <header>
                      {isEligible
                        ? 'Vous souhaitez en savoir plus ?'
                        : 'Vous souhaitez faire connaître votre demande au gestionnaire du réseau le plus proche ou à la collectivité ?'}
                    </header>
                  )}
                  {!storedAddress.contacted && (
                    <ContactFormButtonWrapper>
                      <Button onClick={displayContactForm}>
                        {isEligible ? 'Être mis en relation avec le gestionnaire du réseau' : 'Laissez vos coordonnées'}
                      </Button>
                    </ContactFormButtonWrapper>
                  )}
                </ContactFormWrapper>
              )}
            </>
          )}
        </section>
      </SearchedAddress>
    </>
  );
};

export default CardSearchDetails;
