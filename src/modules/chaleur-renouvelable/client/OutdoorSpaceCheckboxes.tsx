import { useId } from 'react';

import type { EspaceExterieur, TypeLogement } from '@/modules/chaleur-renouvelable/constants';

type OutdoorSpaceCheckboxesProps = {
  onChange: (value: EspaceExterieur | null) => void;
  typeLogement: TypeLogement | null;
  value: EspaceExterieur | null;
};

type OutdoorSpaceCheckboxKey = 'garden' | 'terrace';

export function OutdoorSpaceCheckboxes({ onChange, typeLogement, value }: OutdoorSpaceCheckboxesProps) {
  const id = useId();
  const isDisabled = !typeLogement;
  const hasGarden = getOutdoorSpaceCheckboxState({ checkboxKey: 'garden', typeLogement, value });
  const hasTerrace = getOutdoorSpaceCheckboxState({ checkboxKey: 'terrace', typeLogement, value });

  const handleCheckboxChange = (checkboxKey: OutdoorSpaceCheckboxKey, checked: boolean) => {
    onChange(
      getNextOutdoorSpaceValue({
        checkboxKey,
        checked,
        hasGarden,
        hasTerrace,
        typeLogement,
      })
    );
  };

  return (
    <div className="fr-mb-0 md:col-span-3 flex flex-col gap-2 md:flex-row md:items-center">
      <span>Espaces extérieurs disponibles :</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <OutdoorSpaceCheckbox
          checked={hasGarden}
          disabled={isDisabled}
          id={`${id}-garden`}
          label={typeLogement === 'immeuble_chauffage_individuel' ? 'balcon/terrasse' : 'cour et/ou jardin'}
          onChange={(checked) => handleCheckboxChange('garden', checked)}
        />
        {typeLogement === 'maison_individuelle' && (
          <OutdoorSpaceCheckbox
            checked={hasTerrace}
            disabled={isDisabled}
            id={`${id}-terrace`}
            label="terrasse et/ou balcon"
            onChange={(checked) => handleCheckboxChange('terrace', checked)}
          />
        )}
      </div>
    </div>
  );
}

export function getNextOutdoorSpaceValue({
  checkboxKey,
  checked,
  hasGarden,
  hasTerrace,
  typeLogement,
}: {
  checkboxKey: OutdoorSpaceCheckboxKey;
  checked: boolean;
  hasGarden: boolean;
  hasTerrace: boolean;
  typeLogement: TypeLogement | null;
}): EspaceExterieur | null {
  if (!typeLogement) {
    return null;
  }

  const nextHasGarden = checkboxKey === 'garden' ? checked : hasGarden;
  const nextHasTerrace = checkboxKey === 'terrace' ? checked : hasTerrace;

  if (typeLogement === 'maison_individuelle') {
    return getHouseOutdoorSpaceValue({ hasGarden: nextHasGarden, hasTerrace: nextHasTerrace });
  }

  return nextHasGarden ? getBuildingOutdoorSpaceValue(typeLogement) : 'none';
}

function getOutdoorSpaceCheckboxState({
  checkboxKey,
  typeLogement,
  value,
}: {
  checkboxKey: OutdoorSpaceCheckboxKey;
  typeLogement: TypeLogement | null;
  value: EspaceExterieur | null;
}) {
  if (!typeLogement || !value) {
    return false;
  }

  if (checkboxKey === 'terrace') {
    return typeLogement === 'maison_individuelle' && ['terrasseBalcon', 'terrasseBalconEtJardinCours'].includes(value);
  }

  return ['shared', 'both', 'private', 'jardinCours', 'terrasseBalconEtJardinCours'].includes(value);
}

function getHouseOutdoorSpaceValue({ hasGarden, hasTerrace }: { hasGarden: boolean; hasTerrace: boolean }): EspaceExterieur {
  return hasGarden && hasTerrace ? 'terrasseBalconEtJardinCours' : hasGarden ? 'jardinCours' : hasTerrace ? 'terrasseBalcon' : 'none';
}

function getBuildingOutdoorSpaceValue(typeLogement: Exclude<TypeLogement, 'maison_individuelle'>): EspaceExterieur {
  return typeLogement === 'immeuble_chauffage_collectif' ? 'shared' : 'private';
}

type OutdoorSpaceCheckboxProps = {
  checked: boolean;
  disabled: boolean;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
};

function OutdoorSpaceCheckbox({ checked, disabled, id, label, onChange }: OutdoorSpaceCheckboxProps) {
  return (
    <div className="fr-checkbox-group fr-mb-0">
      <input checked={checked} disabled={disabled} id={id} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
      <label className="fr-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
