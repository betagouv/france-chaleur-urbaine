import React, { useState } from 'react';
import { Handles, Rail, Slider, Tracks } from 'react-compound-slider';

import { ScaleLabelLegend, ScaleLegendBody, ScaleLegendHeader, ScaleLegendWrapper, ScaleSlider } from './ScaleLegend.style';
import { Handle, SliderRail, Track } from '../../Slider/Components';
import { ScaleMaxLabel, ScaleMinLabel } from '../../Slider/Components.styles';
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
  domain,
  onChange,
  defaultValues,
  className,
}: ScaleLegendProps) => {
  const [values, setValues] = useState(defaultValues || domain);
  const minLabel = `${values[0] === domain[0] && domain[0] !== 0 ? '< ' : ''}${values[0]}`;
  const maxLabel = `${values[1] === domain[1] ? '> ' : ''}${values[1]}`;

  return (
    <ScaleLegendWrapper framed={framed} className={className ?? ''}>
      <ScaleLegendHeader>{label}</ScaleLegendHeader>

      <ScaleLegendBody>
        {showColor && <ScaleLabelLegend bgColor={defaultColor + '88'} size={minIconSize} circle={circle} />}

        <ScaleSlider>
          <Slider
            mode={2}
            step={1}
            domain={domain}
            values={values}
            onChange={(newValues) => {
              setValues(newValues as [number, number]);
              onChange([newValues[0] === domain[0] ? -1 : newValues[0], newValues[1] === domain[1] ? Number.MAX_VALUE : newValues[1]]);
            }}
          >
            <Rail>{({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}</Rail>
            <Handles>
              {({ handles, getHandleProps }) => (
                <div>
                  {handles.map((handle) => (
                    <Handle key={handle.id} handle={handle} domain={domain} getHandleProps={getHandleProps} />
                  ))}
                </div>
              )}
            </Handles>
            <Tracks left={false} right={false}>
              {({ tracks, getTrackProps }) => (
                <div>
                  {tracks.map(({ id, source, target }) => (
                    <Track key={id} source={source} target={target} getTrackProps={getTrackProps} />
                  ))}
                </div>
              )}
            </Tracks>
          </Slider>
          <ScaleMinLabel>
            min : <b>{minLabel}</b>
          </ScaleMinLabel>
          <ScaleMaxLabel>
            max : <b>{maxLabel}</b>
          </ScaleMaxLabel>
        </ScaleSlider>
        {showColor && <ScaleLabelLegend bgColor={defaultColor + '88'} size={maxIconSize} circle={circle} />}
      </ScaleLegendBody>
    </ScaleLegendWrapper>
  );
};

export default ScaleLegend;
