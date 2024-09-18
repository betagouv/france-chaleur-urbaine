import { fr } from '@codegouvfr/react-dsfr';
import { Range } from '@codegouvfr/react-dsfr/Range';
import React from 'react';

import Box from '@components/ui/Box';

import { ScaleLabelLegend, ScaleLegendBody, ScaleLegendHeader, ScaleLegendWrapper, ScaleSlider } from './ScaleLegend.style';
import { maxIconSize, minIconSize } from '../map-layers';

interface ScaleLegendProps {
  label: string;
  color?: string;
  showColor?: boolean;
  circle?: boolean;
  framed?: boolean;
  domain: [number, number];
  defaultValues?: [number, number];
  onChange: (values: [number, number]) => void;
  className?: string;
}
const ScaleLegend = ({
  label,
  framed,
  color: defaultColor,
  showColor = true,
  circle,
  domain: bounds,
  onChange,
  defaultValues,
  className,
  ...props
}: ScaleLegendProps) => {
  const values = defaultValues || bounds;
  const [valueMin, setValueMin] = React.useState(values[0]);
  const [valueMax, setValueMax] = React.useState(values[1] > bounds[1] ? bounds[1] : values[1]);
  const minLabel = `${valueMin === bounds[0] && bounds[0] !== 0 ? '< ' : ''}${bounds[0]}`;
  const maxLabel = `${valueMax === bounds[1] ? '> ' : ''}${bounds[1]}`;
  const [min, max] = bounds;

  return (
    <ScaleLegendWrapper framed={framed} className={className ?? ''}>
      <ScaleLegendHeader>{label}</ScaleLegendHeader>

      <ScaleLegendBody>
        {showColor && <ScaleLabelLegend bgColor={defaultColor + '88'} size={minIconSize} circle={circle} />}

        <ScaleSlider>
          <Range
            label={''}
            small
            double
            max={max}
            min={min}
            step={1}
            hideMinMax
            nativeInputProps={[
              {
                value: valueMin,
                onChange: (e) => {
                  const newValueMin = +e.target.value;
                  setValueMin(newValueMin);
                  onChange([newValueMin, valueMax]);
                },
              },
              {
                value: valueMax,
                onChange: (e) => {
                  const newValueMax = +e.target.value;
                  setValueMax(newValueMax);
                  onChange([valueMin, newValueMax]);
                },
              },
            ]}
            {...props}
          />
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <span className={fr.cx('fr-range__min')} aria-hidden>
              {minLabel}
            </span>
            <span className={fr.cx('fr-range__max')} aria-hidden>
              {maxLabel}
            </span>
          </Box>
        </ScaleSlider>
        {showColor && <ScaleLabelLegend bgColor={defaultColor + '88'} size={maxIconSize} circle={circle} />}
      </ScaleLegendBody>
    </ScaleLegendWrapper>
  );
};

export default ScaleLegend;
