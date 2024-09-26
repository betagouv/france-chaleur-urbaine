import { Range } from '@codegouvfr/react-dsfr/Range';
import React, { ReactNode } from 'react';

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
}

const RangeFilter = ({
  label,
  value: values,
  domain: bounds,
  onChange,
  unit = '',
  tooltip,
  domainTransform: valueTransform,
  ...props
}: RangeFilterProps) => {
  const getValue = (value: number) => (valueTransform ? valueTransform.percentToValue(value) : value);
  const [valueMin, setValueMin] = React.useState(getValue(values[0]));
  const [valueMax, setValueMax] = React.useState(getValue(values[1]));
  const [min, max] = bounds;

  return (
    <Range
      label={
        <Box display="flex" alignItems="center" justifyContent="space-between">
          {label}
          {tooltip && <SimpleTooltip icon={<Icon size="sm" name="ri-information-fill" cursor="help" />}>{tooltip}</SimpleTooltip>}
        </Box>
      }
      small
      double
      max={max}
      min={min}
      nativeInputProps={[
        {
          value: valueMin,
          onChange: (e) => {
            const newValueMin = getValue(+e.target.value);
            setValueMin(newValueMin);
            onChange([newValueMin, valueMax]);
          },
        },
        {
          value: valueMax,
          onChange: (e) => {
            const newValueMax = getValue(+e.target.value);
            setValueMax(newValueMax);
            onChange([valueMin, newValueMax]);
          },
        },
      ]}
      suffix={unit}
      {...props}
    />
  );
};

export default RangeFilter;
