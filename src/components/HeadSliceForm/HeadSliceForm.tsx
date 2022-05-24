import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import { SliceContactFormStyle } from '@components/EligibilityForm/components/EligibilityForm.styled';
import MarkdownWrapper from '@components/MarkdownWrapper';
import markupData, {
  facebookEvent,
  googleAdsEvent,
  linkedInEvent,
  matomoEvent,
} from '@components/Markup';
import Slice from '@components/Slice';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Container,
  FormLabel,
  FormWarningMessage,
  HeadSliceContainer,
  PageBody,
  PageTitle,
  PageTitlePreTitle,
} from './HeadSliceForm.style';

type HeadBannerType = {
  bg?: string;
  bgPos?: string;
  CheckEligibility?: boolean;
  formLabel?: string;
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

  const handleOnChangeAddress = useCallback((data) => {
    const { address, chauffage } = data;
    setAddressData(data);
    setShowWarning(address && !chauffage);
  }, []);
  const handleOnFetch = useCallback(
    ({ address }) => {
      const { chauffage }: any = addressData;
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
    }
  }, []);

  const handleOnSubmitContact = useCallback((data: Record<string, any>) => {
    callMarkup__handleOnSubmitContact(data);
  }, []);
  const handleAfterSubmitContact = useCallback(() => {
    setMessageSent(true);
  }, []);

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
            onChange={handleOnChangeAddress}
            onFetch={handleOnFetch}
            onSuccess={handleOnSuccessAddress}
          >
            {Child}
          </EligibilityFormAddress>

          <FormWarningMessage show={showWarning}>
            {warningMessage}
          </FormWarningMessage>
        </>
      ) : (
        <>{Child}</>
      ),
    [
      CheckEligibility,
      Child,
      formLabel,
      handleOnChangeAddress,
      handleOnFetch,
      showWarning,
      handleOnSuccessAddress,
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
        className={`slice-contact-form-wrapper ${messageSent ? 'active' : ''}`}
      >
        <EligibilityFormMessageConfirmation />
      </Slice>
    </>
  );
};

export default HeadSlice;
