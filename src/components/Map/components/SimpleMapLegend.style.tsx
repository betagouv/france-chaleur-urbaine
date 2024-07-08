import Box from '@components/ui/Box';
import { TrackingEvent, trackEvent } from 'src/services/analytics';
import styled, { css } from 'styled-components';

const StyledDSFRCheckbox = styled.div<{
  checked: boolean;
}>`
  ${({ checked }) =>
    checked &&
    css`
      background-color: var(--background-active-blue-france);
      --data-uri-svg: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23f5f5fe' d='m10 15.17 9.2-9.2 1.4 1.42L10 18l-6.36-6.36 1.4-1.42z'/%3E%3C/svg%3E") !important;
    `}

  --data-uri-svg: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3C/svg%3E");
  background-image: radial-gradient(
      at 5px 4px,
      transparent 4px,
      var(--border-action-high-blue-france) 4px,
      var(--border-action-high-blue-france) 5px,
      transparent 6px
    ),
    linear-gradient(
      var(--border-action-high-blue-france),
      var(--border-action-high-blue-france)
    ),
    radial-gradient(
      at calc(100% - 5px) 4px,
      transparent 4px,
      var(--border-action-high-blue-france) 4px,
      var(--border-action-high-blue-france) 5px,
      transparent 6px
    ),
    linear-gradient(
      var(--border-action-high-blue-france),
      var(--border-action-high-blue-france)
    ),
    radial-gradient(
      at calc(100% - 5px) calc(100% - 4px),
      transparent 4px,
      var(--border-action-high-blue-france) 4px,
      var(--border-action-high-blue-france) 5px,
      transparent 6px
    ),
    linear-gradient(
      var(--border-action-high-blue-france),
      var(--border-action-high-blue-france)
    ),
    radial-gradient(
      at 5px calc(100% - 4px),
      transparent 4px,
      var(--border-action-high-blue-france) 4px,
      var(--border-action-high-blue-france) 5px,
      transparent 6px
    ),
    linear-gradient(
      var(--border-action-high-blue-france),
      var(--border-action-high-blue-france)
    ),
    var(--data-uri-svg);
  background-position:
    0 0,
    0.25rem 0,
    100% 0,
    0 0.25rem,
    100% 100%,
    calc(100% - 0.25rem) 100%,
    0 100%,
    100% 0.25rem,
    50%;
  background-repeat: no-repeat;
  background-size:
    0.25rem 0.25rem,
    calc(100% - 0.25rem) 1px,
    0.25rem 0.25rem,
    1px calc(100% - 0.5rem),
    0.25rem 0.25rem,
    calc(100% - 0.5rem) 1px,
    0.25rem 0.25rem,
    1px calc(100% - 0.5rem),
    1rem;
  border-radius: 0.25rem;

  height: 1rem;
  width: 1rem;
  cursor: pointer;

  outline-style: none;
  outline-color: #0a76f6;
  outline-offset: 2px;
  outline-width: 2px;
  input[type='checkbox']:focus + & {
    outline-style: solid;
  }
`;

const StyledCheckboxInput = styled.input`
  opacity: 0;
  position: absolute;
  height: 1rem !important;
  width: 1rem !important;
`;

type ExtractSuffix<
  T extends string,
  S extends string,
> = T extends `${infer Prefix}${S}` ? Prefix : never;

type LegendTrackingEvent = ExtractSuffix<TrackingEvent, '|Active'>;

interface SingleCheckboxProps {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  trackingEvent?: LegendTrackingEvent;
}

/**
 * Offre une checkbox DSFR fonctionnant de manière séparée de son label.
 */
export function SingleCheckbox({
  name,
  checked,
  onChange,
  trackingEvent,
}: SingleCheckboxProps) {
  return (
    <Box position="relative" px="1w" py="1v">
      <StyledCheckboxInput
        type="checkbox"
        name={name}
        id={name}
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
          trackingEvent &&
            trackEvent(`${trackingEvent}|${checked ? 'Active' : 'Désactive'}`);
        }}
        className="opacity-0"
      />
      <StyledDSFRCheckbox checked={checked} />
    </Box>
  );
}

export const InfoIcon = styled.div`
  position: relative;
  align-self: flex-start;

  & > .hover-info {
    width: 270px;
  }
  &:hover {
    & > .hover-info {
      display: block;
    }
  }
`;

export const DeactivatableBox = styled(Box)<{ disabled?: boolean }>`
  transition: opacity 0.25s ease-in-out;

  ${({ disabled }) =>
    disabled &&
    css`
      opacity: 0.3;
      cursor: not-allowed !important;
      & > * {
        pointer-events: none;
        user-select: none;
      }
    `}
`;
