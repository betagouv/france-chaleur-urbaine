import { EligibilityFormAddress } from '@components/EligibilityForm';
import {
  Loader,
  LoaderWrapper,
} from '@components/HeadSliceForm/HeadSliceForm.style';
import { EligibilityResult } from '@components/Map/components/CardSearchDetails.style';
import { Button, Col } from '@dataesr/react-dsfr';
import { useContactFormFCU } from '@hooks';
import { useMemo } from 'react';
import { Container, Result } from './Eligibility.styles';

const Eligibility = () => {
  const {
    showWarning,
    loadingStatus,
    warningMessage,
    EligibilityFormContactRef,
    addressData,
    contactReady,
    handleOnChangeAddress,
    handleOnFetchAddress,
    handleOnSuccessAddress,
  } = useContactFormFCU();

  const readableDistance = useMemo(() => {
    const { distance } = addressData.eligibility || { distance: null };

    if (distance === null) {
      return '';
    }

    if (distance < 1) {
      return '< 1m';
    }
    if (distance >= 1000) {
      return `${distance / 1000}km`;
    }
    return `${distance}m`;
  }, [addressData]);

  const eligibilityWording = useMemo(() => {
    const { distance, isEligible } = addressData.eligibility || {
      distance: null,
    };

    if (
      (isEligible && distance === null) ||
      (distance !== null && distance < 100)
    ) {
      return `Bonne nouvelle ! Un réseau de chaleur passe à proximité de cette adresse.`;
    }
    if (distance !== null && distance < 200) {
      return `Votre immeuble n’est pas à proximité immédiate d’un réseau de chaleur, toutefois le réseau n’est pas très loin.`;
    }
    return `D'après nos données, il n'y a pour le moment pas de réseau de chaleur à proximité de cette adresse.`;
  }, [addressData]);

  return (
    <Container>
      <EligibilityFormAddress
        onChange={handleOnChangeAddress}
        onFetch={handleOnFetchAddress}
        onSuccess={handleOnSuccessAddress}
      ></EligibilityFormAddress>
      {showWarning && (
        <Col n="12">
          <b>{warningMessage}</b>
        </Col>
      )}
      {!contactReady && !showWarning && loadingStatus === 'loading' && (
        <Col n="12">
          <LoaderWrapper show>
            <Loader color="balck" />
          </LoaderWrapper>
        </Col>
      )}
      {contactReady && (
        <Col n="12">
          <Result ref={EligibilityFormContactRef}>
            <EligibilityResult isEligible={addressData.eligibility?.isEligible}>
              {eligibilityWording}
              <div>
                <strong>
                  {readableDistance && `Le réseau passe à ${readableDistance}`}
                </strong>
              </div>
              <Button className="fr-mt-1w">Laisser mes coordonnées</Button>
            </EligibilityResult>
          </Result>
        </Col>
      )}
    </Container>
  );
};

export default Eligibility;
