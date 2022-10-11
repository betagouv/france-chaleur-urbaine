import AddressAutocomplete from '@components/addressAutocomplete';
import React, { useCallback, useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { AddressDataType } from 'src/types/AddressData';
import { Coords } from 'src/types/Coords';
import { HeatNetworksResponse } from 'src/types/HeatNetworksResponse';
import { SuggestionItem } from 'src/types/Suggestions';
import { CheckEligibilityFormLabel, SelectEnergy } from './components';

export type EnergyInputsLabelsType = { collectif: string; individuel: string };

type CheckEligibilityFormProps = {
  children?: React.ReactNode;
  fullAddress?: any;
  formLabel?: React.ReactNode;
  heatingLabel?: React.ReactNode;
  energyInputsLabels?: EnergyInputsLabelsType;
  cardMode?: boolean;
  onChange?: (...arg: any) => void;
  onFetch?: (...arg: any) => void;
  onSuccess?: (...arg: any) => void;
};

const energyInputsDefaultLabels = {
  collectif: 'Collectif',
  individuel: 'Individuel',
};

const AddressTestForm: React.FC<CheckEligibilityFormProps> = ({
  children,
  fullAddress,
  formLabel,
  heatingLabel,
  energyInputsLabels = energyInputsDefaultLabels,
  cardMode,
  onChange,
  onFetch,
  onSuccess,
}) => {
  const [lon, lat] = fullAddress?.addressDetails?.geoAddress?.geometry
    ?.coordinates || [null, null];
  const coords = (lon ?? lat) && { lon, lat };
  const defaultData: AddressDataType = {
    address: fullAddress?.address,
    eligibility: fullAddress?.addressDetails?.network,
    geoAddress: fullAddress?.addressDetails?.geoAddress,
    coords,
  };

  const [status, setStatus] = useState(!coords ? 'idle' : 'success');
  const [data, setData] = useState<AddressDataType>(defaultData);
  const [heatingType, setHeatingType] = useState('');
  const { heatNetworkService } = useServices();

  const checkEligibility = useCallback(
    async (
      coords: Coords,
      city: string,
      callBack: (response: HeatNetworksResponse) => void
    ) => {
      try {
        setStatus('loading');
        const networkData = await heatNetworkService.findByCoords(coords, city);
        callBack(networkData);
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    },
    [heatNetworkService]
  );

  const handleAddressSelected = useCallback(
    async (address: string, geoAddress: SuggestionItem): Promise<void> => {
      if (onFetch) {
        onFetch({ address, geoAddress });
      }
      const [lon, lat] = geoAddress.geometry.coordinates;
      const coords = { lon, lat };
      await checkEligibility(
        coords,
        geoAddress.properties.city,
        (response: HeatNetworksResponse) =>
          setData({
            ...data,
            address,
            coords: geoAddress.geometry.coordinates,
            geoAddress,
            eligibility: response,
          })
      );
    },
    [checkEligibility, data, onFetch]
  );

  useEffect(() => {
    if (status === 'success' && onSuccess) {
      const cleaningFunction = onSuccess({ ...data, heatingType });
      if (typeof cleaningFunction === 'function') {
        return cleaningFunction;
      }
    }
  }, [data, heatingType, onSuccess, status]);

  useEffect(() => {
    if (onChange) {
      const cleaningFunction = onChange({ ...data, heatingType });
      if (typeof cleaningFunction === 'function') {
        return cleaningFunction;
      }
    }
  }, [data, heatingType, onChange]);

  return (
    <>
      {children}
      <CheckEligibilityFormLabel>
        <SelectEnergy
          label={heatingLabel}
          name="heatingType"
          selectOptions={energyInputsLabels}
          onChange={(e) => setHeatingType(e.target.value)}
          cardMode={cardMode}
        >
          {formLabel}
        </SelectEnergy>
      </CheckEligibilityFormLabel>
      {!coords && (
        <AddressAutocomplete
          placeholder="Tapez ici votre adresse"
          onAddressSelected={handleAddressSelected}
          popoverClassName={'popover-search-form'}
        />
      )}
    </>
  );
};

export default AddressTestForm;
