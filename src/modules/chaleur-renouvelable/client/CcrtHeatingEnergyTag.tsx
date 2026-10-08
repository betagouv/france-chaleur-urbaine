import Tag from '@/components/ui/Tag';
import cx from '@/utils/cx';

import type { CcrtDemand } from '../types';

const energyColors: Record<string, string> = {
  Autre: 'bg-(--background-contrast-grey)! text-(--text-default-grey)!',
  Bois: 'bg-(--background-contrast-green-bourgeon)! text-(--text-action-high-green-bourgeon)!',
  Fioul: 'bg-(--background-contrast-yellow-tournesol)! text-[#7d6a20]!',
  Gaz: 'bg-(--background-contrast-green-menthe)! text-(--text-action-high-blue-france)!',
  'Réseau de chaleur': 'bg-(--background-contrast-blue-ecume)! text-(--text-action-high-blue-ecume)!',
  Électricité: 'bg-(--background-contrast-blue-france)! text-(--text-action-high-blue-france)!',
};

type CcrtHeatingEnergyTagProps = Pick<CcrtDemand, 'heating_energy' | 'housing_type'> & { className?: string };

/**
 * Energy tags use the Figma gas/oil palette and matching DSFR accent colors for the other energies.
 */
export function CcrtHeatingEnergyTag({ heating_energy, housing_type, className }: CcrtHeatingEnergyTagProps) {
  return (
    <Tag size="sm" className={cx('font-normal', energyColors[heating_energy] ?? energyColors.Autre, className)}>
      {heating_energy} {housing_type === 'immeuble_chauffage_collectif' ? 'collectif' : 'individuel'}
    </Tag>
  );
}
