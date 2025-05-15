import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import AddressAutocomplete, { type AddressAutocompleteInputProps } from '@/components/form/dsfr/AddressAutocompleteInput';
import Box from '@/components/ui/Box';
import Link from '@/components/ui/Link';
import { useServices } from '@/services';
import { type AddressDataType } from '@/types/AddressData';
import { type SuggestionItem } from '@/types/Suggestions';

import { CheckEligibilityFormLabel, SelectEnergy } from './components';

export type EnergyInputsLabelsType = { collectif: string; individuel: string };

type CheckEligibilityFormProps = {
  children?: React.ReactNode;
  fullAddress?: any;
  formLabel?: React.ReactNode;
  heatingLabel?: React.ReactNode;
  initialHeatingType?: string;
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
  initialHeatingType,
  energyInputsLabels = energyInputsDefaultLabels,
  cardMode,
  colored,
  onChange,
  onFetch,
  onSuccess,
}) => {
  const router = useRouter();
  const coords = useMemo(() => {
    const [lon, lat] = fullAddress?.addressDetails?.geoAddress?.geometry?.coordinates || [null, null];
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
  const [heatingType, setHeatingType] = useState(initialHeatingType ?? '');
  const { heatNetworkService } = useServices();

  useEffect(() => {
    const { heating } = router.query;
    if (heating) {
      setHeatingType(heating as string);
    }
  }, [router.query]);

  const handleAddressSelected: AddressAutocompleteInputProps['onSelect'] = useCallback(
    async (geoAddress?: SuggestionItem): Promise<void> => {
      const address = geoAddress?.properties?.label;

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
          className="fr-mb-0"
          name="heatingType"
          selectOptions={energyInputsLabels}
          onChange={setHeatingType}
          value={heatingType}
          cardMode={cardMode}
        >
          {formLabel}
        </SelectEnergy>
      </CheckEligibilityFormLabel>
      {!coords && <AddressAutocomplete nativeInputProps={{ placeholder: 'Tapez ici votre adresse' }} onSelect={handleAddressSelected} />}
      {status === 'eligibilitySubmissionError' && (
        <Box textColor="#c00" ml="auto">
          Une erreur est survenue. Veuillez réessayer ou bien <Link href="/contact">contacter le support</Link>.
        </Box>
      )}
    </>
  );
};

export default AddressTestForm;
