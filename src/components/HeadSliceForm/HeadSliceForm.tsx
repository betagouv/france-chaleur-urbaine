import { useRouter } from 'next/router';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { EligibilityFormContact } from '@/components/EligibilityForm';
import { CheckEligibilityFormLabel, SelectEnergy } from '@/components/EligibilityForm/components';
import { type EnergyInputsLabelsType, energyInputsDefaultLabels } from '@/components/EligibilityForm/EligibilityFormAddress';
import AddressAutocomplete from '@/components/form/dsfr/AddressAutocompleteInput';
import MarkdownWrapper from '@/components/MarkdownWrapper';
import Slice from '@/components/Slice';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Modal, { createModal } from '@/components/ui/Modal';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import { AnalyticsFormId } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import type { AvailableHeating } from '@/modules/app/types';
import type { SuggestionItem } from '@/modules/ban/types';
import DemandSondageForm from '@/modules/demands/client/DemandSondageForm';
import trpc from '@/modules/trpc/client';
import cx from '@/utils/cx';
import { Container, FormLabel, HeadSliceContainer, PageBody, PageTitle, SliceContactFormStyle } from './HeadSliceForm.style';

type HeadBannerType = {
  bg?: string;
  bgPos?: string;
  checkEligibility?: boolean;
  formLabel?: string;
  energyInputsLabels?: EnergyInputsLabelsType;
  pageTitle?: string;
  pageBody?: string;
  children?: React.ReactNode;
  needGradient?: boolean;
  externBulkForm?: boolean;
  withBulkEligibility?: boolean;

  // allows to override the default slice wrapper
  withWrapper?: (form: React.ReactElement) => React.ReactElement;
};

const eligibilityTestModal = createModal({
  id: 'eligibility-test-modal',
  isOpenedByDefault: false,
});

const HeadSliceForm = ({
  bg,
  bgPos,
  checkEligibility,
  formLabel,
  pageTitle,
  pageBody,
  children,
  needGradient,
  withBulkEligibility,
  withWrapper,
}: HeadBannerType) => {
  const {
    addressData,
    contactReady,
    showWarning,
    messageReceived,
    loadingStatus,
    warningMessage,
    setLoadingStatus,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
    handleResetFormContact,
  } = useContactFormFCU();

  const trpcUtils = trpc.useUtils();
  const router = useRouter();

  const [geoAddress, setGeoAddress] = useState<SuggestionItem>();
  const { address, heatingType, setAddress, setHeatingType } = useUserInfo();
  const [autoValidate, setAutoValidate] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(false);

  const child = useMemo(
    () =>
      (pageTitle || pageBody) && (
        <>
          {pageTitle && <PageTitle className="fr-mb-4w">{pageTitle}</PageTitle>}
          {pageBody && (
            <PageBody>
              <MarkdownWrapper value={pageBody} />
              {children}
            </PageBody>
          )}
        </>
      ),
    [children, pageBody, pageTitle]
  );

  const testAddress = useCallback(async () => {
    setEligibilityError(false);
    if (!geoAddress) {
      return;
    }

    if (handleOnFetchAddress) {
      handleOnFetchAddress({ address });
    }
    const [lon, lat] = geoAddress.geometry.coordinates;
    const coords = { lat, lon };

    try {
      const isCity = geoAddress.properties.label === geoAddress.properties.city;
      const networkData = isCity
        ? await trpcUtils.client.reseaux.cityNetwork.query({ city: geoAddress.properties.city })
        : await trpcUtils.client.reseaux.eligibilityStatus.query({
            city: geoAddress.properties.city,
            lat,
            lon,
          });
      handleOnSuccessAddress({
        address,
        coords,
        eligibility: networkData,
        geoAddress,
        heatingType: heatingType as AvailableHeating,
      });
    } catch (_err: any) {
      setEligibilityError(true);
    }
    setLoadingStatus('idle');
  }, [address, geoAddress, heatingType, trpcUtils, handleOnFetchAddress, handleOnSuccessAddress]);

  useEffect(() => {
    const { heating, address } = router.query;
    if (heating && address) {
      setAutoValidate(true);
    }

    if (heating) {
      setHeatingType(heating as Parameters<typeof setHeatingType>[0]);
    }
    if (address) {
      setAddress(address as string);
    }
  }, [router.query]);

  useEffect(() => {
    if (autoValidate && heatingType && address && geoAddress) {
      setAutoValidate(false);
      void testAddress();
    }
  }, [heatingType, address, geoAddress, autoValidate, testAddress]);

  const WrappedChild = useMemo(
    () =>
      checkEligibility ? (
        <>
          {child}
          <form id={AnalyticsFormId.form_test_adresse}>
            {formLabel ? <FormLabel>{formLabel}</FormLabel> : undefined}
            <CheckEligibilityFormLabel>
              <SelectEnergy
                label="Mode de chauffage actuel :"
                name="heatingType"
                selectOptions={energyInputsDefaultLabels}
                onChange={(val) => setHeatingType(val)}
                value={heatingType || ''}
              />
            </CheckEligibilityFormLabel>
            <AddressAutocomplete
              className="mb-2!"
              defaultValue={address}
              nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
              onClear={() => {
                setAddress('');
                setGeoAddress(undefined);
              }}
              onSelect={(geoAddress?: SuggestionItem) => {
                const address = geoAddress?.properties?.label;
                setAddress(address ?? '');
                setGeoAddress(geoAddress);
              }}
              onError={() => {
                setLoadingStatus('idle');
              }}
            />
            <div
              className={cx(
                'fr-mb-2w font-bold pl-4 py-1 border-l-4 border-error bg-white/40',
                address && geoAddress && !heatingType ? 'block' : 'hidden'
              )}
            >
              {warningMessage}
            </div>
            <div className="mb-1">
              {eligibilityError ? (
                <span className="text-error">
                  Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
                </span>
              ) : (
                <>&nbsp;</>
              )}
            </div>
            <div className="flex justify-between gap-2 items-center">
              <Button
                size="medium"
                loading={loadingStatus === 'loading'}
                disabled={!address || !geoAddress || !heatingType || (loadingStatus === 'loading' && !eligibilityError)}
                onClick={testAddress}
              >
                Tester cette adresse
              </Button>
              {withBulkEligibility && (
                <>
                  <span>ou</span>
                  <span className="text-green-700! flex items-center gap-0.5">
                    <Icon name="ri-file-excel-2-line" />
                    <Link
                      href="/pro/tests-adresses"
                      className="text-green-700! hover:bg-transparent! hover:opacity-80 shadow-none! pr-0! pl-0!"
                    >
                      Tester une liste d’adresses
                    </Link>
                  </span>
                </>
              )}
            </div>
          </form>
        </>
      ) : (
        child
      ),
    [
      address,
      eligibilityError,
      geoAddress,
      heatingType,
      testAddress,
      checkEligibility,
      child,
      formLabel,
      loadingStatus,
      showWarning,
      warningMessage,
      withBulkEligibility,
    ]
  );

  return (
    <>
      <SliceContactFormStyle />
      {withWrapper ? (
        withWrapper(WrappedChild as any)
      ) : (
        <Slice theme="grey" bg={bg} bgPos={bgPos} bgColor="#CDE3F0" padding={8}>
          <HeadSliceContainer needGradient={needGradient}>
            <Container>{WrappedChild}</Container>
          </HeadSliceContainer>
        </Slice>
      )}
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
            <EligibilityFormContact addressData={addressData} onSubmit={handleOnSubmitContact} className="p-0" />
          )}
          {messageReceived && <DemandSondageForm addressData={addressData} cardMode />}
        </div>
      </Modal>
    </>
  );
};

export default HeadSliceForm;
