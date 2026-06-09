import { Range, type RangeProps } from '@codegouvfr/react-dsfr/Range';
import { useCounter } from '@react-hookz/web';
import { type ReactNode, useCallback, useEffect, useRef } from 'react';

import Box from '@/components/ui/Box';
import Loader from '@/components/ui/Loader';
import Tooltip from '@/components/ui/Tooltip';
import type { Interval } from '@/utils/interval';

export function roundNumberProgressively(v: number): number {
  return v > 2 ? Math.round(v) : v > 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}

export type RangeFilterProps = Omit<RangeProps, 'min' | 'max' | 'nativeInputProps' | 'label'> & {
  label?: RangeProps['label'];
  value?: Interval;
  domain: Interval;
  onChange: (values: Interval) => void;
  unit?: string;
  tooltip?: string | ReactNode;
  domainTransform?: {
    percentToValue: (value: number) => number;
    valueToPercent: (value: number) => number;
  };
  loading?: boolean;
  formatNumber?: (value: number) => string;
  /**
   * For sliders whose bound means "and beyond" (number of units, gas consumption…): the config stores an
   * out-of-domain sentinel (e.g. `Number.MAX_VALUE`). Clamps the displayed value to the domain and shows
   * `< min` / `> max` on the bound labels when a thumb reaches the edge (no `<` when `domain[0] === 0`).
   */
  openEndedBounds?: boolean;
};

const RangeFilter = ({
  label,
  value: defaultValues,
  domain,
  onChange,
  unit = '',
  double = true,
  tooltip,
  loading,
  disabled,
  domainTransform,
  formatNumber = (v) => `${roundNumberProgressively(v)}`,
  openEndedBounds = false,
  ...props
}: RangeFilterProps) => {
  const values = defaultValues || domain;

  const valueMin = domainTransform ? domainTransform.valueToPercent(values[0]) : values[0];
  const valueMax = domainTransform ? domainTransform.valueToPercent(values[1]) : values[1];
  const [renderKey, { inc }] = useCounter(0);

  const [min, max] = domainTransform ? [0, 100] : domain;
  const ref = useRef<HTMLDivElement>(null);

  // DSFR doesn't let us change this text through a prop and rewrites `.fr-range__output` on every `update()`
  // (drag/resize): we keep its "plain" format (the `< `/`> ` hints live on the bound labels, which are stable).
  const reformatRangeOutputText = useCallback(
    (min: number, max: number) => {
      // Clamp to the domain: with `openEndedBounds` the config stores an out-of-domain sentinel (e.g. Number.MAX_VALUE).
      const clamp = (v: number) => (openEndedBounds ? Math.min(Math.max(v, domain[0]), domain[1]) : v);
      const updateRangeText = () => {
        const textToUpdate = ref.current?.querySelector('.fr-range__output');
        if (textToUpdate && textToUpdate.textContent !== '') {
          textToUpdate.textContent = loading ? '...' : `${formatNumber(clamp(min))}${unit} - ${formatNumber(clamp(max))}${unit}`;
          return;
        }
        // Retry after 50ms if the element is not found
        setTimeout(updateRangeText, 50);
      };

      updateRangeText();
    },
    [formatNumber, unit, loading, openEndedBounds, domain[0], domain[1]]
  );

  useEffect(() => {
    // Everytime value changes, reformat displayed values
    reformatRangeOutputText(values[0], values[1]);
  }, [values[0], values[1], renderKey]);

  useEffect(() => {
    // Remount (via `key`) to force DSFR to redraw the colored track on a programmatic reset (the "Réinitialiser"
    // button) — but never during an interaction: it would steal focus from the thumb, and DSFR already redraws
    // by itself on a real input event.
    if (values[0] === domain[0] && values[1] === domain[1] && !ref.current?.contains(document.activeElement)) {
      inc();
    }
  }, [values[0], values[1], domain[0], domain[1]]);

  useEffect(() => {
    // DSFR component does not redraw when changing loading
    // This is an attempt to fix it
    inc();
  }, [loading]);

  const handleChangeMin = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      const newValueMin = domainTransform ? domainTransform.percentToValue(value) : value;
      onChange([newValueMin, values[1]]);
    },
    [domainTransform, onChange, values]
  );

  const handleChangeMax = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = +e.target.value;
      const newValueMax = domainTransform ? domainTransform.percentToValue(value) : value;
      onChange([values[0], newValueMax]);
    },
    [domainTransform, onChange, values]
  );

  // `openEndedBounds` switches to our custom bound labels (like `domainTransform`) so we can prefix them.
  const hideMinMax = !!domainTransform || loading || openEndedBounds;
  const lowerBoundPrefix = openEndedBounds && values[0] <= domain[0] && domain[0] !== 0 ? '< ' : '';
  const upperBoundPrefix = openEndedBounds && values[1] >= domain[1] ? '> ' : '';

  return (
    <>
      <Range
        key={renderKey}
        disabled={loading || disabled}
        label={
          <Box display="flex" alignItems="center" justifyContent="space-between">
            {label}
            {tooltip && <Tooltip title={tooltip} />}
          </Box>
        }
        ref={ref}
        double={double}
        max={max}
        min={min}
        hideMinMax={hideMinMax}
        nativeInputProps={[
          {
            onChange: handleChangeMin,
            value: valueMin,
          },
          {
            onChange: handleChangeMax,
            value: valueMax,
          },
        ]}
        suffix={unit}
        {...props}
      />

      {hideMinMax && (
        <Box display="flex" justifyContent="space-between">
          <div className="fr-range__min">
            {loading ? (
              <Loader size="sm" className="fr-mt-1v" />
            ) : (
              <>
                {lowerBoundPrefix}
                {formatNumber(domain[0])}
                {unit}
              </>
            )}
          </div>
          <div className="fr-range__max">
            {loading ? (
              <Loader size="sm" className="fr-mt-1v" />
            ) : (
              <>
                {upperBoundPrefix}
                {formatNumber(domain[1])}
                {unit}
              </>
            )}
          </div>
        </Box>
      )}
    </>
  );
};

// Set display name for debugging purposes
RangeFilter.displayName = 'RangeFilter';

export default RangeFilter;
