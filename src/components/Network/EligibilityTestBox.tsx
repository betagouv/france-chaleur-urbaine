import { useStore } from '@tanstack/react-form';
import { useEffect, useState } from 'react';

import { EligibilityFormContact } from '@/components/EligibilityForm';
import { type EligibilityTestValues, heatingTypeOptions, zEligibilityTest } from '@/components/EligibilityForm/eligibilityTestValidation';
import Box from '@/components/ui/Box';
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
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import trpc from '@/modules/trpc/client';

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
    setLoadingStatus,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
    handleResetFormContact,
  } = useContactFormFCU();

  const urlAddress = useInitialSearchParam('address');
  const { userInfo, setUserInfo } = useUserInfo();
  const [eligibilityError, setEligibilityError] = useState(false);

  const form = useAppForm({
    ...schemaValidation(zEligibilityTest),
    defaultValues: {
      geoAddress: undefined as unknown as BANAddressFeature,
      heatingType: userInfo.heatingType ?? '',
    } as EligibilityTestValues,
    onSubmit: async ({ value }) => {
      setEligibilityError(false);
      const address = value.geoAddress.properties.label;
      handleOnFetchAddress({ address }, 'fiche-reseau');
      const [lon, lat] = value.geoAddress.geometry.coordinates;

      try {
        const isCity = value.geoAddress.properties.label === value.geoAddress.properties.city;
        const networkData = isCity
          ? await trpcUtils.client.reseaux.cityNetwork.query({ city: value.geoAddress.properties.city })
          : await trpcUtils.client.reseaux.eligibilityStatus.query({ lat, lon });
        trackPostHogEvent('network_page:address_test_cta_clicked', { network_id: networkId });
        handleOnSuccessAddress(
          {
            address,
            coords: { lat, lon },
            eligibility: networkData,
            geoAddress: value.geoAddress,
            heatingType: value.heatingType as AvailableHeating,
          },
          'fiche-reseau'
        );
      } catch (_err) {
        setEligibilityError(true);
      }
      setLoadingStatus('idle');
    },
  });

  const geoAddress = useStore(form.store, (state) => state.values.geoAddress);

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
          form.setFieldValue('geoAddress', match, { dontUpdateMeta: true });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [urlAddress, userInfo.address, geoAddress]);

  // le mode de chauffage mémorisé (localStorage) peut arriver après le montage du formulaire
  useEffect(() => {
    if (userInfo.heatingType) {
      form.setFieldValue('heatingType', userInfo.heatingType, { dontUpdateMeta: true });
    }
  }, [userInfo.heatingType]);

  return (
    <>
      <Box p="4w" backgroundColor="blue-france-925-125">
        <Text size="xl" legacyColor="black" mb="2w">
          Testez l'éligibilité de votre adresse
        </Text>
        <Form form={form} id={AnalyticsFormId.form_test_adresse}>
          <form.AppField
            name="heatingType"
            listeners={{
              onChange: ({ value }) => {
                setUserInfo({ heatingType: value as AvailableHeating });
              },
            }}
          >
            {(field) => <field.RadioField label="Mode de chauffage actuel :" orientation="horizontal" options={heatingTypeOptions} />}
          </form.AppField>
          <form.AppField name="geoAddress">
            {(field) => (
              <field.AddressSelectField
                className="mb-2!"
                label=""
                defaultValue={urlAddress ?? userInfo.address}
                nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
                onClear={() => {
                  setUserInfo({ address: '' });
                }}
                onSelect={(selectedGeoAddress) => {
                  setUserInfo({ address: selectedGeoAddress?.properties?.label ?? '' });
                  trackPostHogEvent('address_test:started', { chauffage_type: userInfo.heatingType, source: 'fiche-reseau' });
                }}
              />
            )}
          </form.AppField>
          {eligibilityError && (
            <div className="fr-text--sm fr-message--error fr-mb-2w">
              Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
            </div>
          )}
          <form.SubmitButton size="medium" loading={loadingStatus === 'loading'}>
            Tester cette adresse
          </form.SubmitButton>
        </Form>
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
