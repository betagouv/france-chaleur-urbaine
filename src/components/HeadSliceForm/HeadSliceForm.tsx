import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
  EnergyInputsLabelsType,
} from '@components/EligibilityForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import { useContactFormFCU } from '@hooks';
import React, { useMemo } from 'react';
import {
  Container,
  FormLabel,
  FormWarningMessage,
  HeadSliceContainer,
  Loader,
  LoaderWrapper,
  PageBody,
  PageTitle,
  SliceContactFormStyle,
} from './HeadSliceForm.style';

type HeadBannerType = {
  bg?: string;
  bgPos?: string;
  CheckEligibility?: boolean;
  formLabel?: string;
  energyInputsLabels?: EnergyInputsLabelsType;
  pageTitle?: string;
  pageBody?: string;
  children?: React.ReactNode;
  needGradient?: boolean;
};

const HeadSlice = ({
  bg,
  bgPos,
  CheckEligibility,
  formLabel,
  energyInputsLabels,
  pageTitle,
  pageBody,
  children,
  needGradient,
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
    handleOnChangeAddress,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
  } = useContactFormFCU();

  const Child = useMemo(
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

  const WrappedChild = useMemo(
    () =>
      CheckEligibility ? (
        <>
          <EligibilityFormAddress
            formLabel={formLabel && <FormLabel>{formLabel}</FormLabel>}
            energyInputsLabels={energyInputsLabels}
            onChange={handleOnChangeAddress}
            onFetch={handleOnFetchAddress}
            onSuccess={handleOnSuccessAddress}
          >
            {Child}
          </EligibilityFormAddress>

          <FormWarningMessage show={showWarning}>
            {warningMessage}
          </FormWarningMessage>

          <LoaderWrapper show={!showWarning && loadingStatus === 'loading'}>
            <Loader color="#fff" />
          </LoaderWrapper>
        </>
      ) : (
        <>{Child}</>
      ),
    [
      CheckEligibility,
      Child,
      energyInputsLabels,
      formLabel,
      handleOnChangeAddress,
      handleOnFetchAddress,
      handleOnSuccessAddress,
      loadingStatus,
      showWarning,
      warningMessage,
    ]
  );

  return (
    <>
      <Slice
        theme="grey"
        bg={bg}
        bgPos={bgPos}
        bgWidth={1600}
        bgColor="#CDE3F0"
      >
        <HeadSliceContainer needGradient={needGradient}>
          <Container>{WrappedChild}</Container>
        </HeadSliceContainer>
      </Slice>

      <SliceContactFormStyle />

      <div ref={EligibilityFormContactRef}>
        <Slice
          padding={5}
          theme="grey"
          className={`slice-contact-form-wrapper ${
            contactReady && !messageReceived ? 'active' : ''
          }`}
        >
          <EligibilityFormContact
            addressData={addressData}
            isSent={messageSent}
            onSubmit={handleOnSubmitContact}
          />
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
      </div>
    </>
  );
};

export default HeadSlice;
