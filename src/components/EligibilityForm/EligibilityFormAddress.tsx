import AddressAutocomplete from '@components/addressAutocomplete';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useServices } from 'src/services';
import { AddressDataType } from 'src/types/AddressData';
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
  colored?: boolean;
  onChange?: (...arg: any) => void;
  onFetch?: (...arg: any) => void;
  onSuccess?: (...arg: any) => void;
};

export const energyInputsDefaultLabels = {
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
  colored,
  onChange,
  onFetch,
  onSuccess,
}) => {
  const router = useRouter();
  const coords = useMemo(() => {
    const [lon, lat] = fullAddress?.addressDetails?.geoAddress?.geometry
      ?.coordinates || [null, null];
    return (lon ?? lat) && { lon, lat };
  }, [fullAddress]);

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

  useEffect(() => {
    const { heating } = router.query;
    if (heating) {
      setHeatingType(heating as string);
    }
  }, [router.query]);

  const checkEligibility = useCallback(
    async (
      geoAddress: SuggestionItem,
      callBack: (response: HeatNetworksResponse) => void
    ) => {
      try {
        setStatus('loading');
        const networkData = await heatNetworkService.findByCoords(geoAddress);
        callBack(networkData);
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    },
    [heatNetworkService]
  );

  const handleAddressSelected = useCallback(
    async (address: string, geoAddress?: SuggestionItem): Promise<void> => {
      if (!geoAddress) {
        return;
      }

      if (onFetch) {
        onFetch({ address, geoAddress });
      }
      await checkEligibility(geoAddress, (response: HeatNetworksResponse) =>
        setData({
          ...data,
          address,
          coords,
          geoAddress,
          eligibility: response,
        })
      );
    },
    [checkEligibility, coords, data, onFetch]
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
      <CheckEligibilityFormLabel colored={colored}>
        <SelectEnergy
          label={heatingLabel}
          name="heatingType"
          selectOptions={energyInputsLabels}
          onChange={(e) => setHeatingType(e.target.value)}
          value={heatingType}
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
