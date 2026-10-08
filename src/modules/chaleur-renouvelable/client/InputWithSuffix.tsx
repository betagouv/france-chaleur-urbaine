import { useId } from 'react';

import cx from '@/utils/cx';

export type InputWithSuffixProps = {
  label: string;
  onBlur?: () => void;
  onFocus?: () => void;
  onChange: (value: string) => void;
  placeholder: string;
  suffix: string;
  state?: 'default' | 'error';
  stateRelatedMessage?: string;
  type?: 'number' | 'text';
  value: string;
  inputMode: 'search' | 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | undefined;
  min: string;
  step: string;
};

/**
 * Numeric simulator input displaying its unit beside the editable value.
 */
export function InputWithSuffix({
  label,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  suffix,
  state = 'default',
  stateRelatedMessage,
  type = 'number',
  value,
  inputMode,
  min,
  step,
}: InputWithSuffixProps) {
  const inputId = useId();
  const suffixDescriptionId = `${inputId}-suffix`;
  const suffixAnchorText = value || placeholder;
  const hasError = state === 'error';

  return (
    <div className={cx('fr-input-group w-full', hasError && 'fr-input-group--error')}>
      <label className="fr-label mb-2" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <input
          aria-describedby={suffixDescriptionId}
          aria-invalid={hasError}
          className="fr-input"
          id={inputId}
          inputMode={inputMode}
          min={min}
          step={step}
          onBlur={onBlur}
          onFocus={onFocus}
          onChange={(event) => onChange(event.target.value)}
          onWheel={(event) => {
            if (event.currentTarget.type === 'number') {
              event.currentTarget.blur();
            }
          }}
          placeholder={placeholder}
          type={type}
          value={value}
        />
        <span id={suffixDescriptionId} className="sr-only">
          Unité : {suffix}
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-4 right-12 flex items-center overflow-hidden whitespace-pre text-base leading-6"
        >
          <span className={value ? 'invisible' : 'invisible italic'}>{suffixAnchorText}</span>
          <span className="ml-1 text-gray-500">{suffix}</span>
        </span>
      </div>
      {hasError && <p className="fr-error-text">{stateRelatedMessage}</p>}
    </div>
  );
}
