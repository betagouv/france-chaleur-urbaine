import { useStore } from '@tanstack/react-form';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { EligibilityFormContact } from '@/components/EligibilityForm';
import { CheckEligibilityFormLabel } from '@/components/EligibilityForm/components';
import type { EnergyInputsLabelsType } from '@/components/EligibilityForm/EligibilityFormAddress';
import { type EligibilityTestValues, heatingTypeOptions, zEligibilityTest } from '@/components/EligibilityForm/eligibilityTestValidation';
import MarkdownWrapper from '@/components/MarkdownWrapper';
import Slice from '@/components/Slice';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Modal, { createModal } from '@/components/ui/Modal';
import useContactFormFCU from '@/hooks/useContactFormFCU';
import useInitialSearchParam from '@/hooks/useInitialSearchParam';
import { AnalyticsFormId, trackPostHogEvent } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import type { AvailableHeating } from '@/modules/app/types';
import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import DemandSubmittedPanel from '@/modules/demands/client/public-forms/DemandSubmittedPanel';
import { Form } from '@/modules/form/Form';
import { schemaValidation, useAppForm } from '@/modules/form/useAppForm';
import trpc from '@/modules/trpc/client';

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
    messageReceived,
    loadingStatus,
    setLoadingStatus,
    handleOnFetchAddress,
    handleOnSuccessAddress,
    handleOnSubmitContact,
    handleResetFormContact,
  } = useContactFormFCU();

  const trpcUtils = trpc.useUtils();

  const urlHeating = useInitialSearchParam('heating');
  const urlAddress = useInitialSearchParam('address');

  const { userInfo, setUserInfo } = useUserInfo();
  const [autoValidate, setAutoValidate] = useState(false);
  const [eligibilityError, setEligibilityError] = useState(false);

  const form = useAppForm({
    ...schemaValidation(zEligibilityTest),
    defaultValues: {
      geoAddress: undefined as unknown as BANAddressFeature,
      heatingType: userInfo.heatingType ?? '',
    } as EligibilityTestValues,
    onSubmit: async ({ value }) => {
      setEligibilityError(false);
      const address = value.geoAddress.properties.label;
      handleOnFetchAddress({ address });
      const [lon, lat] = value.geoAddress.geometry.coordinates;

      try {
        const isCity = value.geoAddress.properties.label === value.geoAddress.properties.city;
        const networkData = isCity
          ? await trpcUtils.client.reseaux.cityNetwork.query({ city: value.geoAddress.properties.city })
          : await trpcUtils.client.reseaux.eligibilityStatus.query({ lat, lon });
        handleOnSuccessAddress({
          address,
          coords: { lat, lon },
          eligibility: networkData,
          geoAddress: value.geoAddress,
          heatingType: value.heatingType as AvailableHeating,
        });
      } catch (_err) {
        setEligibilityError(true);
      }
      setLoadingStatus('idle');
    },
  });

  const geoAddress = useStore(form.store, (state) => state.values.geoAddress);
  const heatingType = useStore(form.store, (state) => state.values.heatingType);

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

  // Sync URL params to localStorage (one-shot — URL params are stable)
  useEffect(() => {
    if (urlHeating || urlAddress) {
      setUserInfo({
        ...(urlHeating ? { heatingType: urlHeating as AvailableHeating } : {}),
        ...(urlAddress ? { address: urlAddress } : {}),
      });
    }
    if (urlHeating && urlAddress) {
      setAutoValidate(true);
    }
  }, [urlHeating, urlAddress, setUserInfo]);

  // Restaure la geoAddress depuis la BAN si l'adresse est connue mais l'objet feature absent (rechargement).
  useEffect(() => {
    if (!userInfo.address || geoAddress) return;
    const controller = new AbortController();
    searchBANAddresses({ query: userInfo.address, signal: controller.signal })
      .then((features) => {
        const match = features.find((f) => f.properties.label === userInfo.address);
        if (match) {
          form.setFieldValue('geoAddress', match, { dontUpdateMeta: true });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [userInfo.address, geoAddress]);

  // le mode de chauffage mémorisé (localStorage ou param URL) peut arriver après le montage du formulaire
  useEffect(() => {
    if (userInfo.heatingType) {
      form.setFieldValue('heatingType', userInfo.heatingType, { dontUpdateMeta: true });
    }
  }, [userInfo.heatingType]);

  useEffect(() => {
    if (autoValidate && heatingType && geoAddress) {
      setAutoValidate(false);
      void form.handleSubmit();
    }
  }, [autoValidate, heatingType, geoAddress]);

  const wrappedChild = checkEligibility ? (
    <>
      {child}
      <Form form={form} id={AnalyticsFormId.form_test_adresse}>
        {formLabel ? <FormLabel>{formLabel}</FormLabel> : undefined}
        <CheckEligibilityFormLabel>
          <form.AppField
            name="heatingType"
            listeners={{
              onChange: ({ value }) => {
                setUserInfo({ heatingType: value as AvailableHeating });
              },
            }}
          >
            {(field) => <field.RadioField label="Mode de chauffage actuel :" orientation="horizontal" options={heatingTypeOptions} />}
          </form.AppField>
        </CheckEligibilityFormLabel>
        <form.AppField name="geoAddress">
          {(field) => (
            <field.AddressSelectField
              className="mb-2!"
              defaultValue={urlAddress ?? userInfo.address}
              nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }}
              onClear={() => {
                setUserInfo({ address: '' });
              }}
              onSelect={(selectedGeoAddress) => {
                setUserInfo({ address: selectedGeoAddress?.properties?.label ?? '' });
                trackPostHogEvent('address_test:started', { chauffage_type: userInfo.heatingType, source: 'homepage' });
              }}
            />
          )}
        </form.AppField>
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
          <form.SubmitButton size="medium" loading={loadingStatus === 'loading'}>
            Tester cette adresse
          </form.SubmitButton>
          {withBulkEligibility && (
            <>
              <span>ou</span>
              <span className="text-green-700! flex items-center gap-0.5">
                <Icon name="ri-file-excel-2-line" />
                <Link
                  postHogEventKey="home:bulk_test_cta_clicked"
                  href="/pro/tests-adresses"
                  className="text-green-700! hover:bg-transparent! hover:opacity-80 shadow-none! pr-0! pl-0!"
                >
                  Tester une liste d’adresses
                </Link>
              </span>
            </>
          )}
        </div>
      </Form>
    </>
  ) : (
    child
  );

  return (
    <>
      <SliceContactFormStyle />
      {withWrapper ? (
        withWrapper(wrappedChild as any)
      ) : (
        <Slice theme="grey" bg={bg} bgPos={bgPos} bgColor="#CDE3F0" padding={8}>
          <HeadSliceContainer needGradient={needGradient}>
            <Container>{wrappedChild}</Container>
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
          {messageReceived && addressData.submissionResult && <DemandSubmittedPanel submissionResult={addressData.submissionResult} />}
        </div>
      </Modal>
    </>
  );
};

export default HeadSliceForm;
