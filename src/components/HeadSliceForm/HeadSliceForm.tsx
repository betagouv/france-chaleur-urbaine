import {
  EligibilityFormAddress,
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
  EnergyInputsLabelsType,
} from '@components/EligibilityForm';
import BulkEligibilityForm from '@components/EligibilityForm/BulkEligibilityForm';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import WrappedBlock from '@components/WrappedBlock';
import WrappedText from '@components/WrappedText';
import { Button } from '@dataesr/react-dsfr';
import { useContactFormFCU } from '@hooks';
import React, { useMemo, useRef, useState } from 'react';
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
  checkEligibility?: boolean;
  formLabel?: string;
  energyInputsLabels?: EnergyInputsLabelsType;
  pageTitle?: string;
  pageBody?: string;
  children?: React.ReactNode;
  needGradient?: boolean;
  alwaysDisplayBulkForm?: boolean;
};

const HeadSlice = ({
  bg,
  bgPos,
  checkEligibility,
  formLabel,
  energyInputsLabels,
  pageTitle,
  pageBody,
  children,
  needGradient,
  alwaysDisplayBulkForm,
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

  const bulkEligibilityRef = useRef<null | HTMLDivElement>(null);
  const [displayBulkEligibility, setDisplayBulkEligibility] = useState(
    !!alwaysDisplayBulkForm
  );
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

  const WrappedChild = useMemo(
    () =>
      checkEligibility ? (
        <>
          <EligibilityFormAddress
            formLabel={formLabel && <FormLabel>{formLabel}</FormLabel>}
            energyInputsLabels={energyInputsLabels}
            onChange={handleOnChangeAddress}
            onFetch={handleOnFetchAddress}
            onSuccess={handleOnSuccessAddress}
          >
            {child}
          </EligibilityFormAddress>

          <FormWarningMessage show={showWarning}>
            {warningMessage}
          </FormWarningMessage>

          <Button
            size="lg"
            onClick={() => {
              setDisplayBulkEligibility(true);
              bulkEligibilityRef.current?.scrollIntoView({
                behavior: 'smooth',
              });
            }}
          >
            Tester une liste d'adresses en 1 clic
          </Button>

          <LoaderWrapper show={!showWarning && loadingStatus === 'loading'}>
            <Loader color="#fff" />
          </LoaderWrapper>
        </>
      ) : (
        <>{child}</>
      ),
    [
      checkEligibility,
      child,
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
        padding={8}
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

        {checkEligibility && (
          <div ref={bulkEligibilityRef}>
            {displayBulkEligibility && (
              <Slice
                padding={8}
                theme="grey"
                header={`## Vous souhaitez tester un grand nombre d’adresses pour identifier des bâtiments proches des réseaux de chaleur ? Rien de plus simple !`}
                direction="row"
              >
                <WrappedBlock direction="column">
                  <WrappedText
                    body={`
::count-item[*Téléchargez votre fichier (une ligne par adresse)*]{number=1}
::count-item[*Renseignez votre email*]{number=2}
::count-item[*Recevez en quelques minutes par mail le résultat de votre test*]{number=3}
::count-item[*Visualisez l’ensemble des adresses testées sur notre cartographie*]{number=4}
`}
                  />
                  <BulkEligibilityForm />
                </WrappedBlock>
                <WrappedBlock direction="column">
                  <WrappedText body="Vous pourrez ensuite sélectionner dans la liste des adresses celles pour lesquelles vous souhaitez être mis en relation par France Chaleur Urbaine avec le(s) gestionnaire(s) des réseaux de chaleur." />
                  <img width="80%" src="/img/carto-addresses.svg" />
                </WrappedBlock>
              </Slice>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default HeadSlice;
