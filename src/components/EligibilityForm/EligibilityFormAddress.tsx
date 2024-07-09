import AddressAutocomplete from '@components/addressAutocomplete';
import Box from '@components/ui/Box';
import Link from '@components/ui/Link';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useServices } from 'src/services';
import { AddressDataType } from 'src/types/AddressData';
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

  const handleAddressSelected = useCallback(
    async (address: string, geoAddress?: SuggestionItem): Promise<void> => {
      if (!geoAddress) {
        return;
      }

      if (onFetch) {
        onFetch({ address, geoAddress });
      }

      try {
        setStatus('loading');
        const [lon, lat] = geoAddress.geometry.coordinates;
        const coords = { lon, lat };
        const networkData = await heatNetworkService.findByCoords(geoAddress);
        setData({
          ...data,
          address,
          coords,
          geoAddress,
          eligibility: networkData,
        });
        setStatus('success');
      } catch (e) {
        setStatus('eligibilitySubmissionError');
      }
    },
    [heatNetworkService, coords, data, onFetch]
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
          onChange={setHeatingType}
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
        />
      )}
      {status === 'eligibilitySubmissionError' && (
        <Box textColor="#c00" ml="auto">
          Une erreur est survenue. Veuillez réessayer ou bien{' '}
          <Link href="/contact">contacter le support</Link>.
        </Box>
      )}
    </>
  );
};

export default AddressTestForm;
