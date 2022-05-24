import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
} from '@components/EligibilityForm';
import { SliceContactFormStyle } from '@components/EligibilityForm/components/EligibilityForm.styled';
import MarkdownWrapper from '@components/MarkdownWrapper';
import markupData, { facebookEvent, matomoEvent } from '@components/Markup';
import Slice from '@components/Slice';
import React, { useMemo, useState } from 'react';
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

function HeadSlice({
  bg,
  bgPos,
  CheckEligibility,
  formLabel,
  pagePreTitle,
  pageTitle,
  pageBody,
  children,
  needGradient,
}: HeadBannerType) {
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

  const [contactReady, setContactReady] = useState(false);
  const [addressData, setAddressData] = useState({});

  const updateContactData = (data: any) => {
    setAddressData(data);
    const { address, chauffage } = data;
    if (address && chauffage) {
      setContactReady(true);
    }
  };
  const [messageSent, setMessageSent] = useState(false);

  const handleOnSubmit = (data: Record<string, any>) => {
    const { estEligible: eligibility, address } = data;
    const markupEligibilityKey = eligibility
      ? 'contactFormEligible'
      : 'contactFormIneligible';
    matomoEvent(markupData[markupEligibilityKey].matomoEvent, [address]);
    facebookEvent(markupData[markupEligibilityKey].facebookEvent);
  };

  const handleAfterSubmit = () => {
    setMessageSent(true);
  };

  const warningMessage = "N'oubliez pas d'indiquer votre type de chauffage.";
  const [showWarning, setShowWarning] = useState(false);
  const WrappedChild = useMemo(
    () =>
      CheckEligibility ? (
        <>
          <EligibilityFormAddress
            formLabel={formLabel && <FormLabel>{formLabel}</FormLabel>}
            onChange={(data) => {
              const { address, chauffage } = data;
              setAddressData(data);
              setShowWarning(address && !chauffage);
            }}
            onFetch={(address) => {
              const { chauffage }: any = addressData;
              setShowWarning(address && !chauffage);
            }}
            onSuccess={(data) => {
              // TODO: Prefer context ?
              updateContactData(data);
            }}
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
    [CheckEligibility, Child, addressData, formLabel, showWarning]
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
          onSubmit={handleOnSubmit}
          afterSubmit={handleAfterSubmit}
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
}

export default HeadSlice;
