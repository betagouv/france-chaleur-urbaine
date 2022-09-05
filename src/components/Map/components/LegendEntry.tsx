import Hoverable from '@components/Hoverable';
import { Icon } from '@dataesr/react-dsfr';
import LegendDesc from './LegendDesc';
import {
  InfoIcon,
  LabelLegendHead,
  LabelLegendInputLabel,
  LabelLegendInputLabelWrapper,
  LabelLegendMarker,
  LabelLegendWrapper,
} from './LegendEntry.styled';

export type TypeLegendEntry = {
  id: string;
  label: string;
  info?: string;
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
  checked,
  readOnly,
  onChange,
  subLegend,
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
        }}
      />

      <LabelLegendInputLabelWrapper>
        <LabelLegendInputLabel>
          {className && (
            <LabelLegendMarker
              className={`legend-marker ${className}-marker`}
              bgColor={bgColor && `${bgColor}`}
            />
          )}
          <LabelLegendHead type={type}>{label}</LabelLegendHead>
        </LabelLegendInputLabel>
        {subLegend && LegendDesc[subLegend]?.()}
        {info && (
          <InfoIcon>
            <Icon size="lg" name="ri-information-fill" />
            <Hoverable>{info}</Hoverable>
          </InfoIcon>
        )}
      </LabelLegendInputLabelWrapper>
    </LabelLegendWrapper>
  );
}

export default LegendEntry;
