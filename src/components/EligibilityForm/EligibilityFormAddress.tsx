import AddressAutocomplete from '@components/addressAutocomplete';
import { useContactFormFCU, usePreviousState } from '@hooks';
import React, { useCallback, useEffect, useState } from 'react';
import { Point } from 'src/types';
import { CheckEligibilityFormLabel, SelectEnergy } from './components';

export type EnergyInputsLabelsType = { collectif: string; individuel: string };

type CheckEligibilityFormProps = {
  formLabel?: React.ReactNode;
  energyInputsLabels?: EnergyInputsLabelsType;
  centredForm?: boolean;
  forceMobile?: boolean;
  popoverClassName?: string;
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
  forceMobile,
  popoverClassName,
  children,
  onChange,
  onFetch,
  onSuccess,
}) => {
  const [status, setStatus] = useState('idle');
  const [data, setData] = useState({});
  const prevData = usePreviousState(data);
  const { convertAddressBanToFcu } = useContactFormFCU();

  const checkEligibility = useCallback(
    async ({
      address,
      points,
      geoAddress,
    }: {
      address?: string;
      points: Point;
      geoAddress?: any;
    }) => {
      try {
        setStatus('loading');
        const fcuAddress = await convertAddressBanToFcu({
          address,
          points,
          geoAddress,
        });

        setData({ ...data, ...fcuAddress });
        setStatus('success');
      } catch (e) {
        setStatus('error');
      }
    },
    [convertAddressBanToFcu, data]
  );

  const handleAddressSelected = useCallback(
    async (address: string, point: Point, geoAddress: any): Promise<void> => {
      if (onFetch) onFetch({ address, point, geoAddress });
      await checkEligibility({ address, points: point, geoAddress });
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
          forceMobile={forceMobile}
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
        popoverClassName={popoverClassName}
      />
    </>
  );
};

export default AddressTestForm;
