import React from 'react';
import { LabelLegend } from './MapLegend.style';

export type TypeLegendEntry = {
  id: string;
  label: string;
  className?: string;
  bgColor?: string;
};
function LegendEntry({
  id,
  bgColor,
  className,
  label,
  checked,
  onChange,
}: TypeLegendEntry & {
  checked: boolean;
  onChange: (idEntry: any) => void;
}) {
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={checked}
          onChange={() => {
            onChange(id);
          }}
        />
        <LabelLegend
          className={`legend ${className || ''}`}
          bgColor={bgColor && `${bgColor}99`}
        />
        {label}
      </label>
    </div>
  );
}

export default LegendEntry;
