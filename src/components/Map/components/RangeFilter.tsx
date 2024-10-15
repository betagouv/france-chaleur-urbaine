import { Range } from '@codegouvfr/react-dsfr/Range';
import { memo, ReactNode, useCallback, useEffect, useRef } from 'react';

import Box from '@components/ui/Box';
import Tooltip from '@components/ui/Tooltip';
import { Interval } from '@utils/interval';

import { roundNumberProgressively } from './ReseauxDeChaleurFilters';

interface RangeFilterProps {
  label: string;
  value: Interval;
  domain: Interval;
  onChange: (values: Interval) => void;
  unit?: string;
  tooltip?: string | ReactNode;
  domainTransform?: {
    percentToValue: (value: number) => number;
    valueToPercent: (value: number) => number;
  };
  formatNumber?: (value: number) => string;
}

const areIntervalsEqual = (a: Interval, b: Interval) => a[0] === b[0] && a[1] === b[1];

const RangeFilter = memo(
  ({
    label,
    value: values,
    domain,
    onChange,
    unit = '',
    tooltip,
    domainTransform,
    formatNumber = (v) => `${roundNumberProgressively(v)}`,
    ...props
  }: RangeFilterProps) => {
    const valueMin = domainTransform ? domainTransform.valueToPercent(values[0]) : values[0];
    const valueMax = domainTransform ? domainTransform.valueToPercent(values[1]) : values[1];

    const [min, max] = domainTransform ? [0, 100] : domain;
    const ref = useRef<HTMLDivElement>(null);

    // This is needed because DSFR does not give ability to change it through a prop
    const reformatRangeOutput = useCallback(
      (min: number, max: number) => {
        const updateRangeText = () => {
          const textToUpdate = ref.current?.querySelector('.fr-range__output');
          if (textToUpdate && textToUpdate.textContent !== '') {
            textToUpdate.textContent = `${formatNumber(min)}${unit} - ${formatNumber(max)}${unit}`;
            return;
          }
          // Retry after 50ms if the element is not found
          setTimeout(updateRangeText, 50);
        };

        updateRangeText();
      },
      [formatNumber, unit]
    );

    useEffect(() => {
      // Everytime value changes, reformat displayed values
      reformatRangeOutput(values[0], values[1]);
    }, [values[0], values[1]]);

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

    return (
      <>
        <Range
          label={
            <Box display="flex" alignItems="center" justifyContent="space-between">
              {label}
              {tooltip && <Tooltip title={tooltip} />}
            </Box>
          }
          ref={ref}
          small
          double
          max={max}
          min={min}
          hideMinMax={!!domainTransform}
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

        {!!domainTransform && (
          <Box display="flex" justifyContent="space-between">
            <div className="fr-range__min">
              {formatNumber(domain[0])}
              {unit}
            </div>
            <div className="fr-range__max">
              {formatNumber(domain[1])}
              {unit}
            </div>
          </Box>
        )}
      </>
    );
  },
  (prevProps, nextProps) =>
    areIntervalsEqual(prevProps.value, nextProps.value) &&
    areIntervalsEqual(prevProps.domain, nextProps.domain) &&
    prevProps.tooltip === nextProps.tooltip &&
    prevProps.unit === nextProps.unit &&
    prevProps.label === nextProps.label
);

// Set display name for debugging purposes
RangeFilter.displayName = 'RangeFilter';

export default RangeFilter;
