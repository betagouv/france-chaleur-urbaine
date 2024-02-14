import Hoverable from '@components/Hoverable';
import { Icon } from '@dataesr/react-dsfr';
import { ReactNode } from 'react';
import { LayerNameOption } from 'src/services/Map/param';
import LegendDesc from './LegendDesc';
import {
  InfoIcon,
  LabelLegendHead,
  LabelLegendInputLabel,
  LabelLegendInputLabelWrapper,
  LabelLegendMarker,
  LabelLegendWrapper,
} from './LegendEntry.styled';
import { TrackingEvent, trackEvent } from 'src/services/analytics';

export type TypeLegendEntry = {
  id: LayerNameOption;
  label: string;
  trackingEvent?: TrackingEvent;
  info?: ReactNode;
  infoPosition?: 'top' | 'right' | 'top-centered' | 'bottom';
  className?: string;
  type?: string;
  bgColor?: string;
  subLegend?: string;
};

function LegendEntry({
  id,
  bgColor,
  className,
  type,
  label,
  info,
  infoPosition,
  checked,
  readOnly,
  onChange,
  subLegend,
  trackingEvent,
}: TypeLegendEntry & {
  checked: boolean;
  readOnly?: boolean;
  onChange: (idEntry: any) => void;
}) {
  return (
    <LabelLegendWrapper>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => {
          !readOnly && onChange(id);
          trackingEvent &&
            trackEvent(
              (trackingEvent +
                (checked ? '|Active' : '|Désactive')) as TrackingEvent
            );
        }}
      />

      <LabelLegendInputLabelWrapper>
        {label && (
          <LabelLegendInputLabel>
            {className && (
              <LabelLegendMarker
                className={`legend-marker ${className}-marker`}
                bgColor={bgColor && `${bgColor}`}
              />
            )}
            <LabelLegendHead type={type}>{label}</LabelLegendHead>
          </LabelLegendInputLabel>
        )}
        {subLegend && LegendDesc[subLegend]?.()}
        {info && (
          <InfoIcon>
            <Icon size="lg" name="ri-information-fill" />
            <Hoverable position={infoPosition}>{info}</Hoverable>
          </InfoIcon>
        )}
      </LabelLegendInputLabelWrapper>
    </LabelLegendWrapper>
  );
}

export default LegendEntry;
