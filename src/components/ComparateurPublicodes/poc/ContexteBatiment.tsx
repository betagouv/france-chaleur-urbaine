import { useEffect, useState } from 'react';

import Input from '@/components/form/publicodes/Input';
import RadioInput from '@/components/form/publicodes/Radio';
import Select from '@/components/form/publicodes/Select';
import Notice from '@/components/ui/Notice';
import { searchBANAddresses } from '@/modules/ban/client';
import type { BANAddressFeature } from '@/modules/ban/types';
import { AddressField } from '@/modules/form/AddressField';
import { getPrixReseauFiable } from '@/modules/reseaux/constants';
import { buildAddressSituation } from '@/modules/simulator/constants';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { postFetchJSON } from '@/utils/network';

import SelectClimatisation from '../SelectClimatisation';
import SelectProductionECS from '../SelectProductionECS';
import type { SimulatorEngine } from '../useSimulatorEngine';

type ContexteBatimentProps = {
  engine: SimulatorEngine;
  /** Address label owned by the parent (restored from the URL or a default); resolved here through the BAN when it changes */
  address: string | null;
  onAddressChange: (address: string | null) => void;
};

/**
 * Shared context of every scenario, laid out as one compact grid instead of stacked accordions:
 * address (climate + nearest network), building, hot water and cooling.
 */
export function ContexteBatiment({ engine, address, onAddressChange }: ContexteBatimentProps) {
  const [nearestReseauDeChaleur, setNearestReseauDeChaleur] = useState<LocationInfoResponse['nearestReseauDeChaleur']>();
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [addressError, setAddressError] = useState(false);
  const typeBatiment = engine.getField('bâtiment . type');
  const isAddressSelected = engine.getField('climat . code département') !== undefined;

  const handleAddressSelect = async (feature: BANAddressFeature) => {
    try {
      setAddressError(false);
      const [lon, lat] = feature.geometry.coordinates;
      const infos: LocationInfoResponse = await postFetchJSON('/api/location-infos', {
        city: feature.properties.city,
        cityCode: feature.properties.citycode,
        lat,
        lon,
      });
      if (!infos.infosVille) {
        setAddressError(true);
        return;
      }
      setNearestReseauDeChaleur(infos.nearestReseauDeChaleur);
      setResolvedAddress(feature.properties.label);
      onAddressChange(feature.properties.label);
      engine.updateSituation(buildAddressSituation(infos));
    } catch {
      setAddressError(true);
    }
  };

  // Resolves the parent's address through the BAN (same path as a manual selection) unless it is the one already resolved
  useEffect(() => {
    if (!engine.loaded || !address || address === resolvedAddress) {
      return;
    }
    const controller = new AbortController();
    searchBANAddresses({ excludeCities: true, query: address, signal: controller.signal })
      .then((features) => (features[0] ? handleAddressSelect(features[0]) : setAddressError(true)))
      .catch(() => setAddressError(true));
    return () => controller.abort();
  }, [engine.loaded, address]);

  const handleAddressClear = () => {
    setNearestReseauDeChaleur(undefined);
    setResolvedAddress(null);
    setAddressError(false);
    onAddressChange(null);
    engine.updateSituation(buildAddressSituation(null));
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="md:col-span-2">
          <AddressField
            excludeCities
            defaultValue={address ?? ''}
            label="Adresse (climat + réseau le plus proche)"
            state={addressError ? 'error' : undefined}
            stateRelatedMessage={addressError ? 'Ville introuvable pour cette adresse' : undefined}
            onSelect={handleAddressSelect}
            onClear={handleAddressClear}
          />
          {isAddressSelected && (
            <p className="-mt-4 mb-0 text-xs">
              {nearestReseauDeChaleur ? (
                <>
                  Réseau <strong>{nearestReseauDeChaleur.nom_reseau}</strong> à <strong>{nearestReseauDeChaleur.distance} m</strong>
                  {getPrixReseauFiable(nearestReseauDeChaleur.PM) === undefined && ' · tarif non fiable → prix moyen français'}
                </>
              ) : (
                'Aucun réseau de chaleur à proximité → réseau moyen français'
              )}
            </p>
          )}
        </div>
        <RadioInput name="bâtiment . type" small orientation="horizontal" />
        {typeBatiment === 'résidentiel' ? (
          <>
            <Select name="bâtiment . méthode résidentiel" label="Méthode d'estimation des besoins" />
            {engine.getField('bâtiment . méthode résidentiel') === 'DPE' ? (
              <Select name="bâtiment . DPE" label="DPE" />
            ) : (
              <Select name="bâtiment . normes thermiques et âge" label="Normes thermiques et âge" />
            )}
            <Input name="bâtiment . surface tertiaire" label="Surface moyenne d'un logement" nativeInputProps={{ type: 'number' }} />
            <Input
              name="bâtiment . nombre de logements"
              label="Nombre de logements"
              hideUnit
              nativeInputProps={{ min: 1, type: 'number' }}
            />
            <Input name="bâtiment . habitants par logement" label="Habitants par logement" hideUnit nativeInputProps={{ type: 'number' }} />
          </>
        ) : (
          <>
            <Select name="bâtiment . méthode tertiaire" label="Méthode d'estimation des besoins" />
            <Select name="bâtiment . normes thermiques tertiaire" label="Normes thermiques" />
            <Input name="bâtiment . surface tertiaire" label="Surface" nativeInputProps={{ type: 'number' }} />
          </>
        )}
        <SelectProductionECS />
        <SelectClimatisation />
      </div>
      {!isAddressSelected && (
        <Notice variant="info" size="sm">
          Sans adresse, les calculs utilisent le climat par défaut du modèle et le réseau de chaleur moyen français.
        </Notice>
      )}
    </div>
  );
}
