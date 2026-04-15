import { useState } from 'react';

import type { BANAddressFeature } from '@/modules/ban/types';
import { buildAddressSituation, type SimulatorFormState, type SimulatorSituation, type TypeBatiment } from '@/modules/simulator/constants';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { postFetchJSON } from '@/utils/network';

type UseSimulatorFormStateOptions = {
  onAddressInfosLoaded?: (infos: LocationInfoResponse) => void;
  onAddressInfosMissing?: () => void;
  onAddressSituationChange: (situation: SimulatorSituation) => void;
  onFieldInteraction?: () => void;
  onReset?: () => void;
};

/**
 * Manages the shared UI state and address workflow for heat-network simulator forms.
 */
export function useSimulatorFormState({
  onAddressInfosLoaded,
  onAddressInfosMissing,
  onAddressSituationChange,
  onFieldInteraction,
  onReset,
}: UseSimulatorFormStateOptions) {
  const [formState, setFormState] = useState<SimulatorFormState>({
    producesHotWater: 'oui',
    tertiarySector: 'Bureaux',
    typeBatiment: 'residentiel',
  });
  const [address, setAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<BANAddressFeature | null>(null);

  const isAddressSelected = selectedAddress !== null;

  function updateFormState<Key extends keyof SimulatorFormState>(key: Key, value: SimulatorFormState[Key]) {
    onFieldInteraction?.();
    setFormState((state) => ({
      ...state,
      [key]: value,
    }));
  }

  function handleTypeBatimentChange(typeBatiment: TypeBatiment) {
    onFieldInteraction?.();
    setFormState((state) => ({
      ...state,
      nbLogements: undefined,
      surface: undefined,
      typeBatiment,
    }));
  }

  async function handleAddressChange(geoAddress?: BANAddressFeature) {
    if (!geoAddress) {
      setAddress('');
      setSelectedAddress(null);
      onAddressSituationChange(buildAddressSituation());
      onReset?.();
      return;
    }

    setAddress(geoAddress.properties.label);
    setSelectedAddress(geoAddress);

    try {
      const [lon, lat] = geoAddress.geometry.coordinates;
      const infos: LocationInfoResponse = await postFetchJSON('/api/location-infos', {
        city: geoAddress.properties.city,
        cityCode: geoAddress.properties.citycode,
        lat,
        lon,
      });

      if (!infos.infosVille) {
        onAddressSituationChange(buildAddressSituation());
        onAddressInfosMissing?.();
        return;
      }

      onAddressSituationChange(buildAddressSituation(infos));
      onAddressInfosLoaded?.(infos);
    } catch (error) {
      onAddressSituationChange(buildAddressSituation());
    }
  }

  return {
    address,
    formState,
    handleAddressChange,
    handleTypeBatimentChange,
    isAddressSelected,
    updateFormState,
  };
}
