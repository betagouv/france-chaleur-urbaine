import {
  LabelLegend,
  LabelLegendDescription,
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
  description,
  checked,
  readOnly,
  onChange,
}: TypeLegendEntry & {
  checked: boolean;
  readOnly?: boolean;
  onChange: (idEntry: any) => void;
}) {
  return (
    <div>
      <LabelLegendWrapper>
        <label>
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {
              !readOnly && onChange(id);
            }}
          />
          <LabelLegendMarker
            className={`legend-marker ${
              className ? `${className}-marker` : ''
            }`}
            bgColor={bgColor && `${bgColor}`}
          />
          <LabelLegend>
            <LabelLegendHead type={type}>{label}</LabelLegendHead>
            {description && (
              <LabelLegendDescription>{description}</LabelLegendDescription>
            )}
          </LabelLegend>
        </label>
      </LabelLegendWrapper>
    </div>
  );
}

export default LegendEntry;
