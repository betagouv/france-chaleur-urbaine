import AddressAutocomplete from '@components/addressAutocomplete';
import { usePreviousState } from '@hooks';
import convertPointToCoordinates from '@utils/convertPointToCoordinates';
import React, { useCallback, useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { Coords } from 'src/types/Coords';
import { Point } from 'src/types/Point';
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
  const address = fullAddress?.address;
  const {
    lon,
    lat,
    isEligible: eligibility,
    network,
    inZDP,
  } = fullAddress?.addressDetails?.networkDetails || {};
  const coords = (lon ?? lat) && { lon, lat };
  const defaultData = {
    address,
    eligibility,
    coords,
    network,
    inZDP,
  };

  const [status, setStatus] = useState(!coords ? 'idle' : 'success');
  const [data, setData] = useState<Record<string, any>>(defaultData);
  const prevData = usePreviousState(data);
  const { heatNetworkService } = useServices();

  type CallbackParams = {
    eligibility: boolean;
    network: Record<string, any>;
    inZDP: boolean;
  };
  const checkEligibility = useCallback(
    async (
      coords: Coords,
      callBack: ({ eligibility, network, inZDP }: CallbackParams) => void
    ) => {
      try {
        setStatus('loading');
        const networkData = await heatNetworkService.findByCoords(coords);
        const { isEligible: eligibility, network, inZDP } = networkData;
        callBack({ eligibility, network, inZDP });
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    },
    [heatNetworkService]
  );

  const handleAddressSelected = useCallback(
    async (address: string, point: Point, geoAddress: any): Promise<void> => {
      if (onFetch) onFetch({ address, point, geoAddress });
      const coords: Coords = convertPointToCoordinates(point);
      await checkEligibility(coords, ({ eligibility, network, inZDP }) =>
        setData({
          ...data,
          address,
          eligibility,
          coords,
          geoAddress,
          network,
          inZDP,
        })
      );
    },
    [checkEligibility, data, onFetch]
  );

  useEffect(() => {
    if (status === 'success' && onSuccess) {
      const cleaningFunction = onSuccess(data);
      if (typeof cleaningFunction === 'function') {
        return cleaningFunction;
      }
    }
  }, [data, onSuccess, status]);

  useEffect(() => {
    if (prevData !== data && onChange) {
      const cleaningFunction = onChange(data);
      if (typeof cleaningFunction === 'function') {
        return cleaningFunction;
      }
    }
  }, [data, onChange, prevData]);

  return (
    <>
      {children}
      <CheckEligibilityFormLabel>
        <SelectEnergy
          label={heatingLabel}
          name="heatingType"
          selectOptions={energyInputsLabels}
          onChange={(e) => {
            setData({
              ...data,
              heatingType: e.target.value,
            });
          }}
          cardMode={cardMode}
        >
          {formLabel}
        </SelectEnergy>
      </CheckEligibilityFormLabel>
      {!coords && (
        <AddressAutocomplete
          placeholder="Tapez ici votre adresse"
          onAddressSelected={handleAddressSelected}
        />
      )}
    </>
  );
};

export default AddressTestForm;
