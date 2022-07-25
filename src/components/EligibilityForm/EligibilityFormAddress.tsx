import AddressAutocomplete from '@components/addressAutocomplete';
import { usePreviousState } from '@hooks';
import convertPointToCoordinates from '@utils/convertPointToCoordinates';
import React, { useCallback, useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { Coords, Point } from 'src/types';
import { CheckEligibilityFormLabel, SelectEnergy } from './components';

export type EnergyInputsLabelsType = { collectif: string; individuel: string };

type CheckEligibilityFormProps = {
  children?: React.ReactNode;
  formLabel?: React.ReactNode;
  energyInputsLabels?: EnergyInputsLabelsType;
  centredForm?: boolean;
  onChange?: (...arg: any) => void;
  onFetch?: (...arg: any) => void;
  onSuccess?: (...arg: any) => void;
};

const energyInputsDefaultLabels = {
  collectif: 'Collectif',
  individuel: 'Individuel',
};

const AddressTestForm: React.FC<CheckEligibilityFormProps> = ({
  formLabel,
  energyInputsLabels = energyInputsDefaultLabels,
  centredForm,
  children,
  onChange,
  onFetch,
  onSuccess,
}) => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState({});
  const prevData = usePreviousState(data);
  const { heatNetworkService } = useServices();
  const checkEligibility = useCallback(
    async ({
      address,
      coords,
      geoAddress,
    }: {
      address?: string;
      coords: Coords;
      geoAddress?: any;
    }) => {
      try {
        setStatus('loading');
        const networkData = await heatNetworkService.findByCoords(coords);
        const { isEligible: eligibility, network } = networkData;
        setData({ ...data, eligibility, address, coords, geoAddress, network });
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    },
    [data, heatNetworkService]
  );

  const handleAddressSelected = useCallback(
    async (address: string, point: Point, geoAddress: any): Promise<void> => {
      if (onFetch) onFetch({ address, point, geoAddress });
      const coords: Coords = convertPointToCoordinates(point);
      await checkEligibility({ address, coords, geoAddress });
    },
    [checkEligibility, onFetch]
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
      <CheckEligibilityFormLabel centred={centredForm}>
        <SelectEnergy
          name="heatingType"
          selectOptions={energyInputsLabels}
          onChange={(e) => {
            setData({
              ...data,
              heatingType: e.target.value,
            });
          }}
        >
          {formLabel}
        </SelectEnergy>
      </CheckEligibilityFormLabel>
      <AddressAutocomplete
        placeholder="Tapez ici votre adresse"
        onAddressSelected={handleAddressSelected}
      />
    </>
  );
};

export default AddressTestForm;
