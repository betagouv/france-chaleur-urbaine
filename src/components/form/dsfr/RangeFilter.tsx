import { Range, RangeProps } from '@codegouvfr/react-dsfr/Range';
import { useCounter } from '@react-hookz/web';
import { ReactNode, useCallback, useEffect, useRef } from 'react';

import Box from '@components/ui/Box';
import Loader from '@components/ui/Loader';
import Tooltip from '@components/ui/Tooltip';
import { Interval } from '@utils/interval';

export function roundNumberProgressively(v: number): number {
  return v > 2 ? Math.round(v) : v > 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}

type RangeFilterProps = Omit<RangeProps, 'min' | 'max' | 'nativeInputProps'> & {
  label: React.ReactNode;
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
  ...props
}: RangeFilterProps) => {
  const values = defaultValues || domain;

  const valueMin = domainTransform ? domainTransform.valueToPercent(values[0]) : values[0];
  const valueMax = domainTransform ? domainTransform.valueToPercent(values[1]) : values[1];
  const [renderKey, { inc }] = useCounter(0);

  const [min, max] = domainTransform ? [0, 100] : domain;
  const ref = useRef<HTMLDivElement>(null);

  // This is needed because DSFR does not give ability to change it through a prop
  const reformatRangeOutputText = useCallback(
    (min: number, max: number) => {
      const updateRangeText = () => {
        const textToUpdate = ref.current?.querySelector('.fr-range__output');
        if (textToUpdate && textToUpdate.textContent !== '') {
          textToUpdate.textContent = loading ? '...' : `${formatNumber(min)}${unit} - ${formatNumber(max)}${unit}`;
          return;
        }
        // Retry after 50ms if the element is not found
        setTimeout(updateRangeText, 50);
      };

      updateRangeText();
    },
    [formatNumber, unit, loading]
  );

  useEffect(() => {
    // Everytime value changes, reformat displayed values
    reformatRangeOutputText(values[0], values[1]);
  }, [values[0], values[1], renderKey]);

  useEffect(() => {
    // DSFR component does not redraw the full colored background when resetting values
    // This is an attempt to fix it

    if (values[0] === domain[0] && values[1] === domain[1]) {
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

  const hideMinMax = !!domainTransform || loading;

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
            value: valueMin,
            onChange: handleChangeMin,
          },
          {
            value: valueMax,
            onChange: handleChangeMax,
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
