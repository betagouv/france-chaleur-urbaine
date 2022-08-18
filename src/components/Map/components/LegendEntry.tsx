import { Icon } from '@dataesr/react-dsfr';
import {
  LabelLegend,
  LabelLegendDescription,
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
  subLegendTxt?: string;
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
  subLegendTxt,
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

      <LabelLegendInputLabelWrapper>
        <LabelLegendInputLabel>
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
        </LabelLegendInputLabel>
        {subLegendTxt && (
          <LabelLegendDescription>{subLegendTxt}</LabelLegendDescription>
        )}
      </LabelLegendInputLabelWrapper>
    </LabelLegendWrapper>
  );
}

export default LegendEntry;
