import CloseButton from '@components/CloseButton';
import { EligibilitySelectEnergy } from '@components/EligibilityForm';
import React, { useState } from 'react';
import { AddressFcu, Point } from 'src/types';
import {
  EligibilityHeatingForm,
  EligibilityResult,
  MapCard,
  MapCardHeaderButtonZone,
} from './CardDetails.style';

type SearchResult = {
  addressData: AddressFcu;
  onClick?: (addressData: AddressFcu) => void;
  onClickClose?: (addressData: { points?: Point }) => void;
  onClickContact?: (addressData: AddressFcu) => void;
  onSubmitAddressForm?: (addressData: AddressFcu) => void;
};

const energyInputsDefaultLabels = {
  collectif: 'Collectif',
  individuel: 'Individuel',
};

const CardSearchDetails = ({
  addressData,
  onClick,
  onClickClose,
  onClickContact,
  onSubmitAddressForm,
}: SearchResult) => {
  const [showEligibilityForm, setShowEligibilityForm] = useState(false);
  const { distance } = addressData?.network || {};
  const { eligibility: isEligible } = addressData || {};

  const onClickHandler = (ev: React.MouseEvent<HTMLElement>) => {
    const returnVal =
      (typeof onClick === 'function' && onClick(addressData)) || undefined;
    ev.stopPropagation();
    return returnVal;
  };

  const onCloseHandler = () => {
    if (onClickClose) {
      onClickClose(addressData);
    }
  };

  return (
    <MapCard
      isEligible={isEligible}
      typeCard={'search'}
      onClick={onClickHandler}
      className={isEligible ? 'eligible' : 'ineligible'}
      isClickable
    >
      <header>
        {addressData.address}
        <MapCardHeaderButtonZone>
          {onClickClose && <CloseButton onClick={onCloseHandler} />}
        </MapCardHeaderButtonZone>
      </header>
      <section>
        <EligibilityResult isEligible={isEligible}>
          {isEligible
            ? `Bonne nouvelle ! Un réseau de chaleur passe à proximité de cette adresse.`
            : `Cette adresse n'est pour le moment pas raccordable à un réseau de chaleur.`}
        </EligibilityResult>
        <div>
          {!isNaN(distance) &&
            `Distance au réseau ${
              distance < 1
                ? '< 1m'
                : distance >= 1000
                ? `: ${distance / 1000}km`
                : `: ${distance}m`
            }`}
        </div>

        <footer className="map-card-footer">
          <button
            className="fr-btn"
            onClick={() => {
              if (onClickContact) onClickContact({ ...addressData });
              setShowEligibilityForm(!showEligibilityForm);
            }}
          >
            Tester l'elligibilité
          </button>
        </footer>
        <EligibilityHeatingForm className={showEligibilityForm ? 'active' : ''}>
          <EligibilitySelectEnergy
            name="heatingType"
            selectOptions={energyInputsDefaultLabels}
            align="right"
            forceMobile
            onChange={(e) => {
              const newAddressData = {
                ...addressData,
                heatingType: e.target.value,
              };
              if (onSubmitAddressForm) onSubmitAddressForm(newAddressData);
              setShowEligibilityForm(false);
            }}
          />
        </EligibilityHeatingForm>
      </section>
    </MapCard>
  );
};

export default CardSearchDetails;
