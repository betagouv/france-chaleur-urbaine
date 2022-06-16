import MarkdownWrapper from '@components/MarkdownWrapper';
import React, { useMemo } from 'react';
import LegendDesc from './LegendDesc';
import LegendEntry, { TypeLegendEntry } from './LegendEntry';
import {
  GroupeLabelWrapper,
  LegendGroupLabelStyle,
} from './LegendGroupLabel.styled';

export type TypeGroupLegend = {
  id: string;
  title?: string;
  description?: string;
  subLegend?: string;
  entries: TypeLegendEntry[];
  type?: string;
  subGroup?: boolean;
  linkto?: string[];
};

function LegendGroupLabel({
  id,
  title,
  description,
  subLegend,
  entries,
  subGroup,
  layerDisplay,
  linkto,
  onChangeEntry,
}: TypeGroupLegend & {
  layerDisplay: Record<string, string[] | boolean>;
  onChangeEntry: (groupName: string, idEntry: string) => void;
}) {
  const disable = useMemo(
    () =>
      linkto
        ?.map((layerName) => layerDisplay?.[layerName])
        .some((display) => display === false),
    [layerDisplay, linkto]
  );
  return (
    <>
      <LegendGroupLabelStyle />
      <GroupeLabelWrapper disable={disable}>
        {title && <header>{title}</header>}
        {description && (
          <MarkdownWrapper
            className="legend-label-description"
            value={description}
          />
        )}
        <div className={`groupe-label-body ${subGroup ? 'subGroup' : ''}`}>
          {entries.map((entry: TypeLegendEntry) => (
            <LegendEntry
              checked={
                layerDisplay?.[id] instanceof Array
                  ? (layerDisplay?.[id] as string[])?.includes(entry.id)
                  : (layerDisplay?.[id] as boolean)
              }
              type={subGroup ? 'subGroup' : 'group'}
              key={entry.id}
              onChange={() => onChangeEntry(id, entry?.id)}
              readOnly={disable}
              {...entry}
            />
          ))}
        </div>

        {subLegend && LegendDesc?.[subLegend]?.()}
      </GroupeLabelWrapper>
    </>
  );
}

export default LegendGroupLabel;
