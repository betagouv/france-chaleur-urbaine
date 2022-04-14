import React from 'react';
import {
  Input,
  ScaleLabelLegend,
  ScaleLegendBody,
  ScaleLegendHeader,
  ScaleLegendLabel,
  ScaleLegendLabelWrapper,
  ScaleLegendWrapper,
} from './ScaleLegend.style';

const ScaleLegend: React.FC<{
  label: string;
  color?: string;
  scaleLabels: { label: string; size: number; bgColor?: string }[];
  checkbox?: boolean;
  checked?: boolean;
  framed?: boolean;
  onChange?: () => void;
}> = ({
  label,
  checkbox,
  checked,
  framed,
  onChange,
  color: defaultColor,
  scaleLabels,
}) => (
  <ScaleLegendWrapper framed={framed}>
    {checkbox ? (
      <ScaleLegendLabel>
        <Input type="checkbox" checked={checked} onChange={onChange} />
        {label}
      </ScaleLegendLabel>
    ) : (
      <ScaleLegendHeader>{label}</ScaleLegendHeader>
    )}

    <ScaleLegendBody checkbox={checkbox}>
      {scaleLabels.map(({ bgColor, label, size }) => (
        <ScaleLegendLabelWrapper key={label}>
          <ScaleLabelLegend bgColor={bgColor || defaultColor} size={size} />
          {label}
        </ScaleLegendLabelWrapper>
      ))}
    </ScaleLegendBody>
  </ScaleLegendWrapper>
);

export default ScaleLegend;
