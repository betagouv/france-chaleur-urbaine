import React from 'react';
import LegendDesc from './LegendDesc';
import LegendEntry, { TypeLegendEntry } from './LegendEntry';
import { GroupeLabel as GroupeLabelWrapper } from './MapLegend.style';

export type TypeGroupLegend = {
  id: string;
  title?: string;
  entries: TypeLegendEntry[];
  description?: string;
  type?: string;
};
function LegendGroupLabel({
  id,
  title,
  description,
  entries,
  layerDisplay,
  onChangeEntry,
}: TypeGroupLegend & {
  layerDisplay: Record<string, string[]>;
  onChangeEntry: (groupName: string, idEntry: any) => void;
}) {
  return (
    <GroupeLabelWrapper>
      {title && <header>{title}</header>}
      <div className="groupe-label-body">
        {entries.map((entry: TypeLegendEntry) => (
          <LegendEntry
            checked={
              layerDisplay?.[id] && layerDisplay?.[id]?.includes(entry.id)
            }
            key={entry.id}
            onChange={() => onChangeEntry(id, entry.id)}
            {...entry}
          />
        ))}
      </div>

      {description && LegendDesc?.[description]?.()}
    </GroupeLabelWrapper>
  );
}

export default LegendGroupLabel;
