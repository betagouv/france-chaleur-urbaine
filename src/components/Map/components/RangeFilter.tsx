import React from 'react';

import { Handles, Rail, Slider, Tracks } from 'react-compound-slider';

import { Handle, SliderRail, Track } from '@components/Slider/Components';
import { Interval } from '@utils/interval';
import Box from '@components/ui/Box';
import Text from '@components/ui/Text';

interface RangeFilterProps {
  label: string;
  value: Interval;
  domain: Interval;
  onChange: (values: Interval) => void;
  unit?: string;
}

const RangeFilter = ({
  label,
  value,
  domain,
  onChange,
  unit = '',
  ...props
}: RangeFilterProps) => {
  return (
    <Box mx="1w" {...props}>
      <Text lineHeight="18px" fontWeight="bold" mt="1w">
        {label}
      </Text>

      <Box position="relative" mt="2w" mx="1w" {...props}>
        {/* Space needed for margins to work */}
        <Box minHeight="1px" />
        <Slider
          mode={2}
          step={1}
          domain={domain}
          values={value}
          onChange={(newValue) => {
            onChange(newValue as Interval);
          }}
        >
          <Rail>
            {({ getRailProps }) => <SliderRail getRailProps={getRailProps} />}
          </Rail>
          <Handles>
            {({ handles, getHandleProps }) => (
              <>
                {handles.map((handle) => (
                  <Handle
                    key={handle.id}
                    handle={handle}
                    domain={domain}
                    getHandleProps={getHandleProps}
                  />
                ))}
              </>
            )}
          </Handles>
          <Tracks left={false} right={false}>
            {({ tracks, getTrackProps }) => (
              <>
                {tracks.map(({ id, source, target }) => (
                  <Track
                    key={id}
                    source={source}
                    target={target}
                    getTrackProps={getTrackProps}
                  />
                ))}
              </>
            )}
          </Tracks>
        </Slider>
      </Box>

      <Box display="flex" justifyContent="space-between" mt="2w">
        <Box
          backgroundColor="#f3f6f9"
          borderRadius="6px"
          p="1w"
          fontSize="12px"
        >
          min&nbsp;:{' '}
          <b>
            {value[0]} {unit}
          </b>
        </Box>

        <Box
          backgroundColor="#f3f6f9"
          borderRadius="6px"
          p="1w"
          fontSize="12px"
        >
          max&nbsp;:{' '}
          <b>
            {value[1]} {unit}
          </b>
        </Box>
      </Box>
    </Box>
  );
};

export default RangeFilter;
