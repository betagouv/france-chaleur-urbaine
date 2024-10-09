import { Range } from '@codegouvfr/react-dsfr/Range';
import React, { ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import Box from '@components/ui/Box';
import Icon from '@components/ui/Icon';
import { SimpleTooltip } from '@components/ui/Tooltip';
import { Interval } from '@utils/interval';

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

  const [valueMinRaw, setValueMinRaw] = useState<number>(nonLinear ? initNonLinearValue(values[0]) : values[0]);
  const [valueMaxRaw, setValueMaxRaw] = useState<number>(nonLinear ? initNonLinearValue(values[1]) : values[1]);
  const [valueMinTransform, setValueMinTransform] = useState<number>(values[0]);
  const [valueMaxTransform, setValueMaxTransform] = useState<number>(values[1]);
  const [min, max] = bounds;
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nonLinear) {
      const textToUpdate = ref?.current?.querySelector('.fr-range__output');
      if (textToUpdate) {
        textToUpdate.textContent = valueMinTransform.toString() + unit + ' - ' + valueMaxTransform.toString() + unit;
      }
    }
  }, [ref]);

  const onChangeValue = useCallback(
    (rangeValue: number, minOrMax: MinOrMax) => {
      const newValue: number = nonLinear ? getNonLinearTransformValue(rangeValue) : rangeValue;

      if (nonLinear) {
        const textToUpdate = ref?.current?.querySelector('.fr-range__output');
        if (textToUpdate) {
          const text: string =
            minOrMax === 'min'
              ? newValue.toString() + unit + ' - ' + valueMaxTransform.toString() + unit
              : valueMinTransform.toString() + unit + ' - ' + newValue.toString() + unit;
          textToUpdate.textContent = text;
        }
      }
      if (minOrMax === 'min') {
        setValueMinRaw(rangeValue);
        setValueMinTransform(newValue);
        onChange([newValue, valueMaxTransform]);
      } else {
        setValueMaxRaw(rangeValue);
        setValueMaxTransform(newValue);
        onChange([valueMinTransform, newValue]);
      }
    },
    [ref, nonLinear, valueMaxTransform, valueMinTransform]
  );

  return (
    <Range
      label={
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {label}
          {tooltip && <SimpleTooltip icon={<Icon size="sm" name="ri-information-fill" cursor="help" />}>{tooltip}</SimpleTooltip>}
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
