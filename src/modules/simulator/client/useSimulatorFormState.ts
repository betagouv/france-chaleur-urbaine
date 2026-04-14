import { useState } from 'react';

import type { BANAddressFeature } from '@/modules/ban/types';
import {
  buildAddressSituation,
  buildClearedAddressSituation,
  type SimulatorFormState,
  type SimulatorSituation,
  type TypeBatiment,
} from '@/modules/simulator/constants';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { postFetchJSON } from '@/utils/network';

type UseSimulatorFormStateOptions = {
  initialTypeBatiment?: TypeBatiment;
  onAddressError?: (error: unknown) => void;
  onAddressInfosLoaded?: (infos: LocationInfoResponse) => void;
  onAddressInfosMissing?: () => void;
  onAddressSituationChange: (situation: SimulatorSituation) => void;
  onFieldInteraction?: () => void;
  onReset?: () => void;
};

const DEFAULT_FORM_STATE: SimulatorFormState = {
  producesHotWater: 'oui',
  tertiarySector: 'Bureaux',
  typeBatiment: 'residentiel',
};

/**
 * Manages the shared UI state and address workflow for heat-network simulator forms.
 */
export function useSimulatorFormState({
  initialTypeBatiment = 'residentiel',
  onAddressError,
  onAddressInfosLoaded,
  onAddressInfosMissing,
  onAddressSituationChange,
  onFieldInteraction,
  onReset,
}: UseSimulatorFormStateOptions) {
  const [formState, setFormState] = useState<SimulatorFormState>({
    ...DEFAULT_FORM_STATE,
    typeBatiment: initialTypeBatiment,
  });
  const [address, setAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<BANAddressFeature | null>(null);
  const [eligibilityError, setEligibilityError] = useState(false);

  const isAddressSelected = selectedAddress !== null;
  const housingCountOrAreaValue = formState.typeBatiment === 'residentiel' ? formState.nbLogements : formState.surface;

  function updateFormState<Key extends keyof SimulatorFormState>(key: Key, value: SimulatorFormState[Key]) {
    onFieldInteraction?.();
    setFormState((state) => ({
      ...state,
      [key]: value,
    }));
  }

  function resetAddressSelection() {
    setAddress('');
    setSelectedAddress(null);
    setEligibilityError(false);
    onAddressSituationChange(buildClearedAddressSituation());
    onReset?.();
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

  function handleHousingCountOrAreaChange(nextValue: string) {
    const parsedValue = Number.parseInt(nextValue, 10);
    const sanitizedValue = Number.isNaN(parsedValue) ? undefined : parsedValue;

    if (formState.typeBatiment === 'residentiel') {
      updateFormState('nbLogements', sanitizedValue);
      return;
    }

    updateFormState('surface', sanitizedValue);
  }

  async function handleAddressSelected(geoAddress?: BANAddressFeature) {
    if (!geoAddress) {
      return;
    }

    setAddress(geoAddress.properties.label);
    setSelectedAddress(geoAddress);

    try {
      setEligibilityError(false);

      const [lon, lat] = geoAddress.geometry.coordinates;
      const infos: LocationInfoResponse = await postFetchJSON('/api/location-infos', {
        city: geoAddress.properties.city,
        cityCode: geoAddress.properties.citycode,
        lat,
        lon,
      });

      if (!infos.infosVille) {
        setEligibilityError(true);
        onAddressSituationChange(buildClearedAddressSituation());
        onAddressInfosMissing?.();
        return;
      }

      onAddressSituationChange(buildAddressSituation(infos));
      onAddressInfosLoaded?.(infos);
    } catch (error) {
      setEligibilityError(true);
      onAddressSituationChange(buildClearedAddressSituation());
      onAddressError?.(error);
    }
  }

  return {
    address,
    eligibilityError,
    formState,
    handleAddressSelected,
    handleHousingCountOrAreaChange,
    handleTypeBatimentChange,
    housingCountOrAreaValue,
    isAddressSelected,
    resetAddressSelection,
    updateFormState,
  };
}
