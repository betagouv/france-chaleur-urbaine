import { useRouter } from 'next/router';
import { parseAsBoolean, useQueryState } from 'nuqs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { EligibilityFormContact, EligibilityFormMessageConfirmation } from '@/components/EligibilityForm';
import { CheckEligibilityFormLabel, SelectEnergy } from '@/components/EligibilityForm/components';
import { energyInputsDefaultLabels, type EnergyInputsLabelsType } from '@/components/EligibilityForm/EligibilityFormAddress';
import AddressAutocomplete from '@/components/form/dsfr/AddressAutocompleteInput';
import MarkdownWrapper from '@/components/MarkdownWrapper';
import Slice from '@/components/Slice';
import Box from '@/components/ui/Box';
import Button from '@/components/ui/Button';
import Link from '@/components/ui/Link';
import Modal, { createModal } from '@/components/ui/Modal';
import WrappedText from '@/components/WrappedText/WrappedText';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import { useServices } from '@/services';
import { AnalyticsFormId } from '@/services/analytics';
import { type AvailableHeating } from '@/types/AddressData';
import { type SuggestionItem } from '@/types/Suggestions';
import cx from '@/utils/cx';

import { Container, FormLabel, HeadSliceContainer, PageBody, PageTitle, SliceContactFormStyle } from './HeadSliceForm.style';
import BulkEligibilityForm from '../EligibilityForm/BulkEligibilityForm';
import Icon from '../ui/Icon';

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
  const [displayBulkEligibility, setDisplayBulkEligibility] = useQueryState('bulk', parseAsBoolean.withDefault(false));

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

    setDisplayBulkEligibility(null);
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
                label=""
                className="fr-mb-2w"
                name="heatingType"
                selectOptions={energyInputsDefaultLabels}
                onChange={(val) => {
                  setHeatingType(val as AvailableHeating);
                  setAutoValidate(true);
                }}
                value={heatingType || ''}
              />
            </CheckEligibilityFormLabel>
            <AddressAutocomplete
              nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
              onSelect={(geoAddress?: SuggestionItem) => {
                const address = geoAddress?.properties?.label;
                setAddress(address ?? '');
                setGeoAddress(geoAddress);
                setAutoValidate(true);
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

            {eligibilityError && (
              <Box textColor="#c00">
                Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
              </Box>
            )}

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
                  <span className="!text-green-700 flex items-center gap-0.5">
                    <Icon name="ri-file-excel-2-line" />
                    <Button
                      type="button"
                      size="medium"
                      className="!text-green-700 underline hover:!bg-transparent hover:opacity-80 !shadow-none !pr-0 !pl-0"
                      priority="tertiary"
                      onClick={() => {
                        setDisplayBulkEligibility(true);
                      }}
                    >
                      Tester une liste d’adresses
                    </Button>
                  </span>
                </>
              )}
            </div>
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
        open={contactReady || (withBulkEligibility && displayBulkEligibility)}
        size="custom"
        onClose={() => {
          setDisplayBulkEligibility(null);
          handleResetFormContact();
        }}
        loading={loadingStatus === 'loading'}
      >
        <div>
          {contactReady && !messageReceived && <EligibilityFormContact addressData={addressData} onSubmit={handleOnSubmitContact} />}
          {messageReceived && <EligibilityFormMessageConfirmation addressData={addressData} />}
        </div>
        {!externBulkForm && withBulkEligibility && displayBulkEligibility && (
          <div className="flex flex-col gap-2 lg:flex-row">
            <WrappedText
              className="flex-1"
              body={`
### Testez un grand nombre d’adresses pour identifier des bâtiments proches des réseaux de chaleur !
::count-item[*Téléchargez votre fichier (une ligne par adresse) et renseignez votre email*]{number=1}
::count-item[*Recevez par mail le résultat de votre test*]{number=2}
::count-item[*Visualisez les adresses testées sur notre cartographie*]{number=3}
::count-item[*Vous pourrez ensuite sélectionner dans la liste les adresses celles pour lesquelles vous souhaitez être* **mis en relation par France Chaleur Urbaine avec le(s) gestionnaire(s) des réseaux de chaleur.**]{number=4}
`}
            />
            <div className="flex-1">
              <BulkEligibilityForm />
              <img width="100%" src="/img/carto-addresses.png" />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default HeadSliceForm;
