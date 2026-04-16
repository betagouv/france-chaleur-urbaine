import { useState } from 'react';

import type { BANAddressFeature } from '@/modules/ban/types';
import { buildAddressSituation, type SimulatorFormState, type SimulatorSituation, type TypeBatiment } from '@/modules/simulator/constants';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { getNetworkEligibilityDistances } from '@/services/eligibility';
import { postFetchJSON } from '@/utils/network';

type UseSimulatorFormStateOptions = {
  onAddressInfosLoaded?: (infos: LocationInfoResponse) => void;
  onAddressSituationChange: (situation: SimulatorSituation) => void;
  onFieldInteraction?: () => void;
  onReset?: () => void;
};

export function useSimulatorFormState({
  onAddressInfosLoaded,
  onAddressSituationChange,
  onFieldInteraction,
  onReset,
}: UseSimulatorFormStateOptions) {
  const [formState, setFormState] = useState<SimulatorFormState>({
    address: '',
    producesHotWater: 'oui',
    selectedAddress: null,
    tertiarySector: 'Bureaux',
    typeBatiment: 'residentiel',
  });
  const [addressErrorMessage, setAddressErrorMessage] = useState<string | null>(null);

  function updateFormState<Key extends keyof SimulatorFormState>(key: Key, value: SimulatorFormState[Key]) {
    onFieldInteraction?.();
    setFormState((currentState) => ({
      ...currentState,
      [key]: value,
    }));
  }

  function handleTypeBatimentChange(typeBatiment: TypeBatiment) {
    onFieldInteraction?.();
    setFormState((currentState) => ({
      ...currentState,
      nbLogements: undefined,
      surface: undefined,
      typeBatiment,
    }));
  }

  async function handleAddressChange(geoAddress?: BANAddressFeature) {
    if (!geoAddress) {
      setAddressErrorMessage(null);
      setFormState((currentState) => ({
        ...currentState,
        address: '',
        selectedAddress: null,
      }));
      onAddressSituationChange(buildAddressSituation());
      onReset?.();
      return;
    }

    setAddressErrorMessage(null);
    setFormState((currentState) => ({
      ...currentState,
      address: geoAddress.properties.label,
      selectedAddress: geoAddress,
    }));

    try {
      const [lon, lat] = geoAddress.geometry.coordinates;
      const infos: LocationInfoResponse = await postFetchJSON('/api/location-infos', {
        city: geoAddress.properties.city,
        cityCode: geoAddress.properties.citycode,
        lat,
        lon,
      });

      const isEligible =
        infos.nearestReseauDeChaleur &&
        infos.nearestReseauDeChaleur.distance <
          getNetworkEligibilityDistances(infos.nearestReseauDeChaleur['Identifiant reseau']).eligibleDistance;

      if (!infos.infosVille || !isEligible) {
        setAddressErrorMessage("Votre batiment est trop loin d'un réseau de chaleur pour envisager un raccordement");
        return;
      }

      onAddressSituationChange(buildAddressSituation(infos));
      onAddressInfosLoaded?.(infos);
    } catch (error) {
      setAddressErrorMessage(null);
      setFormState((currentState) => ({
        ...currentState,
        selectedAddress: null,
      }));
      onAddressSituationChange(buildAddressSituation());
    }
  }

  return {
    addressErrorMessage,
    formState,
    handleAddressChange,
    handleTypeBatimentChange,
    updateFormState,
  };
}
