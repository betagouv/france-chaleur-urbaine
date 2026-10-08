import cx from '@/utils/cx';

import { type DPE, DPE_VALUES } from '../constants';
import { DpeTag } from './results/ui/DpeTag';

type DpeFieldProps = {
  hasError?: boolean;
  label?: string;
  state?: 'default' | 'error';
  stateRelatedMessage?: string;
  onChange: (value: DPE) => void;
  value: DPE;
};

/**
 * Shared energy-label selector used by the simulator and CCRT building corrections.
 */
export function DpeField({
  hasError = false,
  label = 'Étiquette DPE',
  state,
  stateRelatedMessage = 'À compléter ou vérifier pour affiner vos résultats.',
  value,
  onChange,
}: DpeFieldProps) {
  const isInvalid = hasError || state === 'error';
  return (
    <div className={cx('fr-input-group fr-mb-0', isInvalid && 'fr-input-group--error')}>
      <div className="mb-2 text-sm leading-6 text-(--text-default-grey)">{label}</div>
      <div className="flex flex-wrap gap-1">
        {DPE_VALUES.map((dpeValue) => (
          <DpeTag key={dpeValue} letter={dpeValue} isSelected={value === dpeValue} onClick={() => onChange(dpeValue)} size="md" />
        ))}
      </div>
      {isInvalid && <p className="fr-error-text">{stateRelatedMessage}</p>}
    </div>
  );
}
