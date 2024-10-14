import { Range } from '@codegouvfr/react-dsfr/Range';
import { ReactNode, useCallback, useEffect, useRef } from 'react';

import Box from '@components/ui/Box';
import Tooltip from '@components/ui/Tooltip';
import { Interval } from '@utils/interval';

interface RangeFilterProps {
  label: string | ReactNode;
  value: Interval;
  domain: Interval;
  onChange: (values: Interval) => void;
  unit?: string;
  tooltip?: string | ReactNode;
  domainTransform?: {
    percentToValue: (value: number) => number;
    valueToPercent: (value: number) => number;
  };
  nonLinear?: boolean;
}

type MinOrMax = 'min' | 'max';

const RangeFilter = ({
  label,
  value: values,
  domain: bounds,
  onChange,
  unit = '',
  tooltip,
  domainTransform: valueTransform,
  nonLinear,
  ...props
}: RangeFilterProps) => {
  const valueToPercent = 100 / bounds[1];
  const getNonLinearTransformValue = (value: number) => (valueTransform ? valueTransform.percentToValue(value * valueToPercent) : value);
  const initNonLinearValue = (value: number) => (valueTransform ? valueTransform.valueToPercent(value) / valueToPercent : value);

  const [min, max] = bounds;
  const ref = useRef<HTMLDivElement>(null);

  const valueMinRaw = nonLinear ? initNonLinearValue(values[0]) : values[0];
  const valueMaxRaw = nonLinear ? initNonLinearValue(values[1]) : values[1];

  useEffect(() => {
    if (nonLinear) {
      const textToUpdate = ref?.current?.querySelector('.fr-range__output');
      if (textToUpdate) {
        textToUpdate.textContent = `${values[0]}${unit} - ${values[1]}${unit}`;
      }
    }
  }, [values, nonLinear, unit]);

  const onChangeValue = useCallback(
    (rangeValue: number, minOrMax: MinOrMax) => {
      const newValue = nonLinear ? getNonLinearTransformValue(rangeValue) : rangeValue;

      if (nonLinear) {
        const textToUpdate = ref?.current?.querySelector('.fr-range__output');
        if (textToUpdate) {
          const text = minOrMax === 'min' ? `${newValue}${unit} - ${values[1]}${unit}` : `${values[0]}${unit} - ${newValue}${unit}`;
          textToUpdate.textContent = text;
        }
      }

      const updatedValues: Interval = minOrMax === 'min' ? [newValue, values[1]] : [values[0], newValue];

      onChange(updatedValues);
    },
    [nonLinear, values, unit, onChange]
  );

  return (
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
      nativeInputProps={[
        {
          value: valueMinRaw,
          onChange: (e) => onChangeValue(+e.target.value, 'min'),
        },
        {
          value: valueMaxRaw,
          onChange: (e) => onChangeValue(+e.target.value, 'max'),
        },
      ]}
      suffix={unit}
      {...props}
    />
  );
};

export default RangeFilter;
