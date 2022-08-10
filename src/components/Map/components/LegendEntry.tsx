import {
  LabelLegend,
  LabelLegendHead,
  LabelLegendMarker,
  LabelLegendWrapper,
} from './LegendEntry.styled';

export type TypeLegendEntry = {
  id: string;
  label: string;
  description?: string;
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
      </LabelLegend>
    </LabelLegendWrapper>
  );
}

export default LegendEntry;
