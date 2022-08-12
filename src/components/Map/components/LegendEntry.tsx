import { Icon } from '@dataesr/react-dsfr';
import {
  LabelLegend,
  LabelLegendHead,
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
      {className && (
        <LabelLegendMarker
          className={`legend-marker ${className}-marker`}
          bgColor={bgColor && `${bgColor}`}
        />
      )}
      <LabelLegend>
        <LabelLegendHead type={type}>{label}</LabelLegendHead>
        {info && <Icon size="lg" name="ri-information-fill" title={info} />}
      </LabelLegend>
    </LabelLegendWrapper>
  );
}

export default LegendEntry;
