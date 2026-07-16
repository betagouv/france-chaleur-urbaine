import { useCallback, useEffect, useState } from 'react';

import { EligibilityFormContact } from '@/components/EligibilityForm';
import { SelectEnergy } from '@/components/EligibilityForm/components';
import { energyInputsDefaultLabels } from '@/components/EligibilityForm/EligibilityFormAddress';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import Modal, { createModal } from '@/components/ui/Modal';
import Text from '@/components/ui/Text';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import useInitialSearchParam from '@/hooks/useInitialSearchParam';
import { AnalyticsFormId, trackPostHogEvent } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import type { AvailableHeating } from '@/modules/app/types';
import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { useTrackPageView } from '@/modules/conversion-tracking/client/useTrackPageView';
import DemandSubmittedPanel from '@/modules/demands/client/public-forms/DemandSubmittedPanel';
import { AddressField } from '@/modules/form/AddressField';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';

interface EligibilityTestBoxProps {
  networkId: string;
}

const eligibilityTestModal = createModal({
  id: 'eligibility-test-box-modal',
  isOpenedByDefault: false,
});

/**
 * Formulaire de test d'adresse sur une fiche réseau. Réutilise le parcours principal :
 * éligibilité tous réseaux confondus + formulaire de contact + panneau de confirmation.
 */
const EligibilityTestBox = ({ networkId }: EligibilityTestBoxProps) => {
  const trpcUtils = trpc.useUtils();
  useTrackPageView();
  const {
    addressData,
    contactReady,
    messageReceived,
    loadingStatus,
    warningMessage,
    setLoadingStatus,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
    handleResetFormContact,
  } = useContactFormFCU();

  const urlAddress = useInitialSearchParam('address');
  const { userInfo, setUserInfo } = useUserInfo();
  const [geoAddress, setGeoAddress] = useState<BANAddressFeature>();
  const [eligibilityError, setEligibilityError] = useState(false);

  // Restaure la geoAddress depuis la BAN quand l'adresse est préremplie (param URL ou localStorage) sans objet feature.
  useEffect(() => {
    const address = urlAddress ?? userInfo.address;
    if (!address || geoAddress) {
      return;
    }
    const controller = new AbortController();
    searchBANAddresses({ query: address, signal: controller.signal })
      .then((features) => {
        const match = features.find((f) => f.properties.label === address) ?? features[0];
        if (match) {
          setGeoAddress(match);
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [urlAddress, userInfo.address, geoAddress]);

  const testAddress = useCallback(async () => {
    setEligibilityError(false);
    if (!geoAddress) {
      return;
    }

    handleOnFetchAddress({ address: userInfo.address }, 'fiche-reseau');
    const [lon, lat] = geoAddress.geometry.coordinates;

    try {
      const isCity = geoAddress.properties.label === geoAddress.properties.city;
      const networkData = isCity
        ? await trpcUtils.client.reseaux.cityNetwork.query({ city: geoAddress.properties.city })
        : await trpcUtils.client.reseaux.eligibilityStatus.query({ lat, lon });
      trackPostHogEvent('network_page:address_test_cta_clicked', { network_id: networkId });
      handleOnSuccessAddress(
        {
          address: userInfo.address,
          coords: { lat, lon },
          eligibility: networkData,
          geoAddress,
          heatingType: userInfo.heatingType as AvailableHeating,
        },
        'fiche-reseau'
      );
    } catch (_err) {
      setEligibilityError(true);
    }
    setLoadingStatus('idle');
  }, [
    userInfo.address,
    userInfo.heatingType,
    geoAddress,
    networkId,
    trpcUtils,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    setLoadingStatus,
  ]);

  return (
    <>
      <Box p="4w" backgroundColor="blue-france-925-125">
        <Text size="xl" legacyColor="black" mb="2w">
          Testez l'éligibilité de votre adresse
        </Text>
        <form id={AnalyticsFormId.form_test_adresse}>
          <SelectEnergy
            label="Mode de chauffage actuel :"
            name="heatingType"
            selectOptions={energyInputsDefaultLabels}
            onChange={(heatingType) => setUserInfo({ heatingType })}
            value={userInfo.heatingType ?? ''}
          />
          <AddressField
            className="mb-2!"
            label=""
            defaultValue={urlAddress ?? userInfo.address}
            nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
            onClear={() => {
              setUserInfo({ address: '' });
              setGeoAddress(undefined);
            }}
            onSelect={(selectedGeoAddress?: BANAddressFeature) => {
              setUserInfo({ address: selectedGeoAddress?.properties?.label ?? '' });
              setGeoAddress(selectedGeoAddress);
              trackPostHogEvent('address_test:started', { chauffage_type: userInfo.heatingType, source: 'fiche-reseau' });
            }}
          />
          <div
            className={cx(
              'fr-mb-2w font-bold pl-4 py-1 border-l-4 border-error bg-white/40',
              userInfo.address && geoAddress && !userInfo.heatingType ? 'block' : 'hidden'
            )}
          >
            {warningMessage}
          </div>
          {eligibilityError && (
            <div className="fr-text--sm fr-message--error fr-mb-2w">
              Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
            </div>
          )}
          <Button
            size="medium"
            loading={loadingStatus === 'loading'}
            disabled={!userInfo.address || !geoAddress || !userInfo.heatingType || (loadingStatus === 'loading' && !eligibilityError)}
            onClick={testAddress}
          >
            Tester cette adresse
          </Button>
        </form>
      </Box>

      <Modal
        modal={eligibilityTestModal}
        title=""
        open={contactReady}
        size="custom"
        onClose={() => {
          handleResetFormContact();
        }}
        loading={loadingStatus === 'loading'}
      >
        <div>
          {contactReady && !messageReceived && (
            <EligibilityFormContact
              addressData={addressData}
              onSubmit={(data) => handleOnSubmitContact(data, 'fiche-reseau')}
              className="p-0"
            />
          )}
          {messageReceived && addressData.submissionResult && <DemandSubmittedPanel submissionResult={addressData.submissionResult} />}
        </div>
      </Modal>
    </>
  );
};

export default EligibilityTestBox;
