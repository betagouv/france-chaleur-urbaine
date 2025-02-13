import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { EligibilityFormContact, EligibilityFormMessageConfirmation, type EnergyInputsLabelsType } from '@/components/EligibilityForm';
import { CheckEligibilityFormLabel, SelectEnergy } from '@/components/EligibilityForm/components';
import { energyInputsDefaultLabels } from '@/components/EligibilityForm/EligibilityFormAddress';
import AddressAutocomplete from '@/components/form/dsfr/AddressAutocompleteInput';
import MarkdownWrapper from '@/components/MarkdownWrapper';
import Slice from '@/components/Slice';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import Modal, { createModal } from '@/components/ui/Modal';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import { useServices } from '@/services';
import { AnalyticsFormId } from '@/services/analytics';
import { type AvailableHeating } from '@/types/AddressData';
import { type SuggestionItem } from '@/types/Suggestions';

import BulkEligibilitySlice from './BulkEligibilitySlice';
import {
  Buttons,
  Container,
  FormLabel,
  FormWarningMessage,
  HeadSliceContainer,
  PageBody,
  PageTitle,
  Separator,
  SliceContactFormStyle,
} from './HeadSliceForm.style';

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
  externBulkForm,
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
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
    handleResetFormContact,
  } = useContactFormFCU();

  const { heatNetworkService } = useServices();
  const router = useRouter();

  const [heatingType, setHeatingType] = useState<AvailableHeating>();
  const [geoAddress, setGeoAddress] = useState<SuggestionItem>();
  const [address, setAddress] = useState('');
  const [autoValidate, setAutoValidate] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(false);

  const [displayBulkEligibility, setDisplayBulkEligibility] = useState(false);

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

    setDisplayBulkEligibility(false);
    if (handleOnFetchAddress) {
      handleOnFetchAddress({ address });
    }
    const [lon, lat] = geoAddress.geometry.coordinates;
    const coords = { lon, lat };

    try {
      const networkData = await heatNetworkService.findByCoords(geoAddress);
      handleOnSuccessAddress({
        address,
        heatingType,
        coords,
        geoAddress,
        eligibility: networkData,
      });
    } catch (err: any) {
      setEligibilityError(true);
    }
  }, [address, geoAddress, heatingType, heatNetworkService, handleOnFetchAddress, handleOnSuccessAddress]);

  useEffect(() => {
    const { heating, address } = router.query;
    if (heating && address) {
      setAutoValidate(true);
    }

    if (heating) {
      setHeatingType(heating as AvailableHeating);
    }
  }, [router.query]);

  useEffect(() => {
    if (autoValidate && heatingType && address && geoAddress) {
      setAutoValidate(false);
      testAddress();
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
                className="fr-mb-2w"
                name="heatingType"
                selectOptions={energyInputsDefaultLabels}
                onChange={setHeatingType}
                value={heatingType || ''}
              />
            </CheckEligibilityFormLabel>
            <AddressAutocomplete
              nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
              onSelect={(geoAddress?: SuggestionItem) => {
                const address = geoAddress?.properties?.label;
                setAddress(address ?? '');
                setGeoAddress(geoAddress);
              }}
            />

            <FormWarningMessage show={!!(address && geoAddress && !heatingType)}>{warningMessage}</FormWarningMessage>

            {eligibilityError && (
              <Box textColor="#c00">
                Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
              </Box>
            )}

            <Buttons>
              <Button
                size="large"
                disabled={!address || !geoAddress || !heatingType || (loadingStatus === 'loading' && !eligibilityError)}
                onClick={testAddress}
                loading={loadingStatus === 'loading'}
              >
                Tester cette adresse
              </Button>

              {withBulkEligibility && (
                <>
                  <Separator />
                  <Button
                    type="button"
                    size="large"
                    priority="secondary"
                    onClick={() => {
                      setDisplayBulkEligibility(true);
                      router.push('#test-liste');
                    }}
                  >
                    Ou tester une liste d’adresses
                  </Button>
                </>
              )}
            </Buttons>
          </form>
        </>
      ) : (
        <>{child}</>
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
        withWrapper(WrappedChild)
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
        onClose={handleResetFormContact}
        loading={loadingStatus === 'loading'}
      >
        <div>
          {contactReady && !messageReceived && <EligibilityFormContact addressData={addressData} onSubmit={handleOnSubmitContact} />}
          {messageReceived && <EligibilityFormMessageConfirmation addressData={addressData} />}
        </div>
        {!externBulkForm && withBulkEligibility && <BulkEligibilitySlice displayBulkEligibility={displayBulkEligibility} />}
      </Modal>
    </>
  );
};

export default HeadSliceForm;
