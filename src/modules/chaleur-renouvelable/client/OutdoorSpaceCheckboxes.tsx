import { useId } from 'react';

import {
  type EspaceExterieur,
  getEspaceExterieurCheckboxState,
  getEspaceExterieurFromCheckboxState,
  type TypeLogement,
} from '@/modules/chaleur-renouvelable/constants';
import cx from '@/utils/cx';

type OutdoorSpaceCheckboxesProps = {
  className?: string;
  layout?: OutdoorSpaceCheckboxesLayout;
  onChange: (value: EspaceExterieur | null) => void;
  typeLogement: TypeLogement | null;
  value: EspaceExterieur | null;
};

type OutdoorSpaceCheckboxKey = 'garden' | 'terrace';
type OutdoorSpaceCheckboxesLayout = 'inline' | 'stacked';

export function OutdoorSpaceCheckboxes({ className, layout = 'inline', onChange, typeLogement, value }: OutdoorSpaceCheckboxesProps) {
  const id = useId();
  const isDisabled = !typeLogement;
  const checkboxState = getEspaceExterieurCheckboxState(value);
  const hasGarden = checkboxState.hasGarden;
  const hasTerrace = checkboxState.hasTerrace;

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
    <div className={cx('mb-0 flex flex-col gap-2', layout === 'inline' && 'md:col-span-3 md:flex-row md:items-center', className)}>
      <span className={cx(layout === 'stacked' && 'text-sm mb-2')}>Espaces extérieurs disponibles : </span>
      <div className={cx('flex flex-col gap-2', layout === 'inline' && 'sm:flex-row sm:items-center sm:gap-3')}>
        <OutdoorSpaceCheckbox
          checked={hasGarden}
          disabled={isDisabled}
          id={`${id}-garden`}
          label="Cour et/ou jardin"
          onChange={(checked) => handleCheckboxChange('garden', checked)}
        />
        <OutdoorSpaceCheckbox
          checked={hasTerrace}
          disabled={isDisabled}
          id={`${id}-terrace`}
          label="Terrasse et/ou balcon"
          onChange={(checked) => handleCheckboxChange('terrace', checked)}
        />
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

  return getEspaceExterieurFromCheckboxState(typeLogement, {
    hasGarden: checkboxKey === 'garden' ? checked : hasGarden,
    hasTerrace: checkboxKey === 'terrace' ? checked : hasTerrace,
  });
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
