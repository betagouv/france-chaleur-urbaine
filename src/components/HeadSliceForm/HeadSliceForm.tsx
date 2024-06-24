import {
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
  EnergyInputsLabelsType,
} from '@components/EligibilityForm';
import { energyInputsDefaultLabels } from '@components/EligibilityForm/EligibilityFormAddress';
import {
  CheckEligibilityFormLabel,
  SelectEnergy,
} from '@components/EligibilityForm/components';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import AddressAutocomplete from '@components/addressAutocomplete';
import Box from '@components/ui/Box';
import Link from '@components/ui/Link';
import { Button } from '@dataesr/react-dsfr';
import { useContactFormFCU } from '@hooks';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useServices } from 'src/services';
import { AnalyticsFormId } from 'src/services/analytics';
import { AvailableHeating } from 'src/types/AddressData';
import { SuggestionItem } from 'src/types/Suggestions';
import BulkEligibilitySlice from './BulkEligibilitySlice';
import {
  Buttons,
  Container,
  FormLabel,
  FormWarningMessage,
  HeadSliceContainer,
  Loader,
  LoaderWrapper,
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

const HeadSlice = ({
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
    EligibilityFormContactRef,
    addressData,
    contactReady,
    showWarning,
    messageSent,
    messageReceived,
    loadingStatus,
    warningMessage,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
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
  }, [
    address,
    geoAddress,
    heatingType,
    heatNetworkService,
    handleOnFetchAddress,
    handleOnSuccessAddress,
  ]);

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
                name="heatingType"
                selectOptions={energyInputsDefaultLabels}
                onChange={(e) => setHeatingType(e.target.value)}
                value={heatingType || ''}
              />
            </CheckEligibilityFormLabel>
            <AddressAutocomplete
              placeholder="Tapez ici votre adresse"
              onAddressSelected={(address, suggestionItem) => {
                setAddress(address);
                setGeoAddress(suggestionItem);
                return Promise.resolve();
              }}
            />

            <FormWarningMessage
              show={!!(address && geoAddress && !heatingType)}
            >
              {warningMessage}
            </FormWarningMessage>

            {eligibilityError ? (
              <Box textColor="#c00">
                Une erreur est survenue. Veuillez réessayer ou bien{' '}
                <Link href="/contact">contacter le support</Link>.
              </Box>
            ) : (
              <LoaderWrapper show={!showWarning && loadingStatus === 'loading'}>
                <Loader color="#fff" />
              </LoaderWrapper>
            )}

            <Buttons>
              <Button
                size="lg"
                disabled={!address || !geoAddress || !heatingType}
                onClick={testAddress}
              >
                Tester cette adresse
              </Button>

              {withBulkEligibility && (
                <>
                  <Separator />
                  <Button
                    size="lg"
                    secondary
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
      {withWrapper ? (
        withWrapper(WrappedChild)
      ) : (
        <Slice theme="grey" bg={bg} bgPos={bgPos} bgColor="#CDE3F0" padding={8}>
          <HeadSliceContainer needGradient={needGradient}>
            <Container>{WrappedChild}</Container>
          </HeadSliceContainer>
        </Slice>
      )}

      <SliceContactFormStyle />

      <div ref={EligibilityFormContactRef}>
        <Slice
          padding={5}
          theme="grey"
          className={`slice-contact-form-wrapper ${
            contactReady && !messageReceived ? 'active' : ''
          }`}
        >
          {address && (
            <EligibilityFormContact
              addressData={addressData}
              isSent={messageSent}
              onSubmit={handleOnSubmitContact}
            />
          )}
        </Slice>

        <Slice
          padding={5}
          theme="grey"
          className={`slice-contact-form-wrapper ${
            messageReceived ? 'active' : ''
          }`}
        >
          <EligibilityFormMessageConfirmation addressData={addressData} />
        </Slice>

        {!externBulkForm && withBulkEligibility && (
          <BulkEligibilitySlice
            displayBulkEligibility={displayBulkEligibility}
          />
        )}
      </div>
    </>
  );
};

export default HeadSlice;
