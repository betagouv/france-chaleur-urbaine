import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
  EnergyInputsLabelsType,
} from '@components/EligibilityForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import markupData, {
  facebookEvent,
  googleAdsEvent,
  linkedInEvent,
  matomoEvent,
} from '@components/Markup';
import Slice from '@components/Slice';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  Container,
  FormLabel,
  FormWarningMessage,
  HeadSliceContainer,
  Loader,
  LoaderWrapper,
  PageBody,
  PageTitle,
  PageTitlePreTitle,
  SliceContactFormStyle,
} from './HeadSliceForm.style';

type HeadBannerType = {
  bg?: string;
  bgPos?: string;
  CheckEligibility?: boolean;
  formLabel?: string;
  energyInputsLabels?: EnergyInputsLabelsType;
  pagePreTitle?: string;
  pageTitle?: string;
  pageBody?: string;
  children?: React.ReactNode;
  needGradient?: boolean;
};

const callMarkup__handleOnFetchAddress = (address: string) => {
  matomoEvent(markupData.eligibilityTest.matomoEvent, [address]);
  linkedInEvent(markupData.eligibilityTest.linkedInEvent);
  facebookEvent(markupData.eligibilityTest.facebookEvent);
  googleAdsEvent('10794036298', markupData.eligibilityTest.googleAdsEvent);
};
const callMarkup__handleOnSuccessAddress = ({
  eligibility,
  address,
}: {
  eligibility: boolean;
  address?: string;
}) => {
  if (eligibility) {
    matomoEvent(markupData.eligibilityTestOK.matomoEvent, [
      address || 'Adresse indefini',
    ]);
    linkedInEvent(markupData.eligibilityTestOK.linkedInEvent);
    googleAdsEvent('10794036298', markupData.eligibilityTestOK.googleAdsEvent);
  } else {
    matomoEvent(markupData.eligibilityTestKO.matomoEvent, [
      address || 'Adresse indefini',
    ]);
    linkedInEvent(markupData.eligibilityTestKO.linkedInEvent);
    googleAdsEvent('10794036298', markupData.eligibilityTestKO.googleAdsEvent);
  }
};
const callMarkup__handleOnSubmitContact = (data: Record<string, any>) => {
  const { estEligible: eligibility, address } = data;
  const markupEligibilityKey = eligibility
    ? 'contactFormEligible'
    : 'contactFormIneligible';
  matomoEvent(markupData[markupEligibilityKey].matomoEvent, [address]);
  facebookEvent(markupData[markupEligibilityKey].facebookEvent);
};

const warningMessage = "N'oubliez pas d'indiquer votre type de chauffage.";

const HeadSlice = ({
  bg,
  bgPos,
  CheckEligibility,
  formLabel,
  energyInputsLabels,
  pagePreTitle,
  pageTitle,
  pageBody,
  children,
  needGradient,
}: HeadBannerType) => {
  const [addressData, setAddressData] = useState({});
  const [contactReady, setContactReady] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('idle');

  const EligibilityFormContactRef = useRef(null);

  const handleOnChangeAddress = useCallback((data) => {
    const { address, chauffage } = data;
    setAddressData(data);
    setShowWarning(address && !chauffage);
  }, []);
  const handleOnFetchAddress = useCallback(
    ({ address }) => {
      const { chauffage }: any = addressData;
      setLoadingStatus('loading');
      setMessageSent(false);
      callMarkup__handleOnFetchAddress(address);
      setShowWarning(address && !chauffage);
    },
    [addressData]
  );
  const handleOnSuccessAddress = useCallback((data: any) => {
    const { address, chauffage, eligibility } = data;
    callMarkup__handleOnSuccessAddress({ eligibility, address });
    // TODO: Prefer context ?
    setAddressData(data);
    if (address && chauffage) {
      setContactReady(true);
      const scrollTimer = window.setTimeout(() => {
        const { current }: any = EligibilityFormContactRef;
        current?.scrollIntoView({
          behavior: 'smooth',
        });
        setLoadingStatus('loaded');
      }, 500);

      return () => window.clearTimeout(scrollTimer);
    }
  }, []);

  const handleOnSubmitContact = useCallback((data: Record<string, any>) => {
    callMarkup__handleOnSubmitContact(data);
  }, []);
  const handleAfterSubmitContact = useCallback(
    (submitedAddressData) => {
      setAddressData({ ...addressData, ...submitedAddressData });
      setMessageSent(true);
    },
    [addressData]
  );

  const Child = useMemo(
    () =>
      (pageTitle || pagePreTitle || pageBody) && (
        <>
          {(pageTitle || pagePreTitle) && (
            <PageTitle className="fr-mb-4w">
              {pagePreTitle && (
                <PageTitlePreTitle>{pagePreTitle}</PageTitlePreTitle>
              )}
              {pageTitle}
            </PageTitle>
          )}
          {pageBody && (
            <PageBody>
              <MarkdownWrapper value={pageBody} />
              {children}
            </PageBody>
          )}
        </>
      ),
    [children, pageBody, pagePreTitle, pageTitle]
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
            contactReady && !messageSent ? 'active' : ''
          }`}
        >
          <EligibilityFormContact
            addressData={addressData}
            onSubmit={handleOnSubmitContact}
            afterSubmit={handleAfterSubmitContact}
          />
        </Slice>

        <Slice
          padding={5}
          theme="grey"
          className={`slice-contact-form-wrapper ${
            messageSent ? 'active' : ''
          }`}
        >
          <EligibilityFormMessageConfirmation addressData={addressData} />
        </Slice>
      </div>
    </>
  );
};

export default HeadSlice;
