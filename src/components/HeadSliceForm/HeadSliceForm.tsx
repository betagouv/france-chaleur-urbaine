import {
  EligibilityFormContact,
  EligibilityFormMessageConfirmation,
  EnergyInputsLabelsType,
} from '@components/EligibilityForm';
import BulkEligibilityForm from '@components/EligibilityForm/BulkEligibilityForm';
import { energyInputsDefaultLabels } from '@components/EligibilityForm/EligibilityFormAddress';
import {
  CheckEligibilityFormLabel,
  SelectEnergy,
} from '@components/EligibilityForm/components';
import MarkdownWrapper from '@components/MarkdownWrapper';
import Slice from '@components/Slice';
import WrappedText from '@components/WrappedText';
import AddressAutocomplete from '@components/addressAutocomplete';
import { Button } from '@dataesr/react-dsfr';
import { useContactFormFCU } from '@hooks';
import { useRouter } from 'next/router';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useServices } from 'src/services';
import { AvailableHeating } from 'src/types/AddressData';
import { SuggestionItem } from 'src/types/Suggestions';
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
  alwaysDisplayBulkForm?: boolean;
  withBulkEligibility?: boolean;
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
  alwaysDisplayBulkForm,
  withBulkEligibility,
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

  const testAddress = useCallback(async () => {
    if (!geoAddress) {
      return;
    }

    setDisplayBulkEligibility(false);
    if (handleOnFetchAddress) {
      handleOnFetchAddress({ address });
    }
    const [lon, lat] = geoAddress.geometry.coordinates;
    const coords = { lon, lat };

    const networkData = await heatNetworkService.findByCoords(
      coords,
      geoAddress.properties.city
    );

    handleOnSuccessAddress({
      address,
      heatingType,
      coords,
      geoAddress,
      eligibility: networkData,
    });
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
          <FormLabel>{formLabel}</FormLabel>
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
            popoverClassName={'popover-search-form'}
          />

          <FormWarningMessage show={!!(address && geoAddress && !heatingType)}>
            {warningMessage}
          </FormWarningMessage>

          <LoaderWrapper show={!showWarning && loadingStatus === 'loading'}>
            <Loader color="#fff" />
          </LoaderWrapper>

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
                    bulkEligibilityRef.current?.scrollIntoView({
                      behavior: 'smooth',
                    });
                  }}
                >
                  Ou tester une liste d’adresses
                </Button>
              </>
            )}
          </Buttons>
        </>
      ) : (
        <>{child}</>
      ),
    [
      address,
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
      <Slice theme="grey" bg={bg} bgPos={bgPos} bgColor="#CDE3F0" padding={8}>
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

        {withBulkEligibility && (
          <div ref={bulkEligibilityRef} id="test-liste">
            {displayBulkEligibility && (
              <Slice
                padding={8}
                theme={alwaysDisplayBulkForm ? undefined : 'grey'}
                direction="row"
              >
                <div className="fr-col-lg-6 fr-col-md-12 fr-pr-4w">
                  <WrappedText
                    body={`
### Testez un grand nombre d’adresses pour identifier des bâtiments proches des réseaux de chaleur !
::count-item[*Téléchargez votre fichier (une ligne par adresse) et renseignez votre email*]{number=1}
::count-item[*Recevez par mail le résultat de votre test*]{number=2}
::count-item[*Visualisez les adresses testées sur notre cartographie*]{number=3}
::count-item[*Vous pourrez ensuite sélectionner dans la liste les adresses celles pour lesquelles vous souhaitez être* **mis en relation par France Chaleur Urbaine avec le(s) gestionnaire(s) des réseaux de chaleur.**]{number=4}
`}
                  />
                </div>
                <div className="fr-col-lg-6 fr-col-md-12">
                  <BulkEligibilityForm />
                  <img width="100%" src="/img/carto-addresses.png" />
                </div>
              </Slice>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default HeadSlice;
