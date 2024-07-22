import { ReactNode } from 'react';

import { Handles, Rail, Slider, Tracks } from 'react-compound-slider';

import { Handle, SliderRail, Track } from '@components/Slider/Components';
import { Interval } from '@utils/interval';
import Box from '@components/ui/Box';
import Text from '@components/ui/Text';
import { SimpleTooltip } from '@components/ui/Tooltip';
import Icon from '@components/ui/Icon';

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
  value,
  domain,
  onChange,
  unit = '',
  tooltip,
  domainTransform,
  ...props
}: RangeFilterProps) => {
  return (
    <Box mx="1w" position="relative" {...props}>
      <Box display="flex" alignItems="center" mt="1w">
        <Text size="sm" lineHeight="18px" fontWeight="bold" mr="1w">
          {label}
        </Text>
        {tooltip && (
          <SimpleTooltip
            icon={<Icon size="sm" name="ri-information-fill" cursor="help" />}
          >
            {tooltip}
          </SimpleTooltip>
        )}
      </Box>
      <Box position="relative" mt="2w" mx="1w" {...props}>
        {/* Space needed for margins to work */}
        <Box minHeight="1px" />
        <Slider
          mode={2}
          step={1}
          domain={domainTransform ? [0, 100] : domain}
          values={
            domainTransform
              ? [
                  domainTransform.valueToPercent(value[0]),
                  domainTransform.valueToPercent(value[1]),
                ]
              : value
          }
          onChange={(newValue) => {
            onChange(
              (domainTransform
                ? [
                    domainTransform.percentToValue(newValue[0]),
                    domainTransform.percentToValue(newValue[1]),
                  ]
                : newValue) as Interval
            );
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
          backgroundColor="info-975-75"
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
          backgroundColor="info-975-75"
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
