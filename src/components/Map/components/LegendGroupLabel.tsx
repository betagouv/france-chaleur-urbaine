import { useMemo } from 'react';
import { TypeLayerDisplay } from 'src/services/Map/param';
import { TypeGroupLegend } from 'src/types/TypeGroupLegend';
import LegendDesc from './LegendDesc';
import LegendEntry, { TypeLegendEntry } from './LegendEntry';
import {
  GroupeLabelWrapper,
  LegendGroupLabelStyle,
} from './LegendGroupLabel.styled';

function LegendGroupLabel({
  id,
  subLegend,
  entries,
  subGroup,
  layerDisplay,
  linkto,
  onChangeEntry,
  onValuesChange,
}: TypeGroupLegend & {
  layerDisplay: TypeLayerDisplay;
  onChangeEntry: (groupName: string, idEntry: string) => void;
  onValuesChange?: (
    groupName: string,
    idEntry: string,
    values: [number, number]
  ) => void;
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
        <div className={`groupe-label-body ${subGroup ? 'subGroup' : ''}`}>
          {entries.map((entry: TypeLegendEntry) => (
            <LegendEntry
              checked={
                layerDisplay?.[id as keyof TypeLayerDisplay] instanceof Array
                  ? (
                      layerDisplay?.[id as keyof TypeLayerDisplay] as string[]
                    )?.includes(entry.id)
                  : (layerDisplay?.[id as keyof TypeLayerDisplay] as boolean)
              }
              type={subGroup ? 'subGroup' : 'group'}
              key={entry.id}
              onChange={() => onChangeEntry(id, entry?.id)}
              readOnly={disable}
              {...entry}
            />
          ))}
        </div>
        {subLegend &&
          LegendDesc[subLegend]?.(
            (values) =>
              onValuesChange && onValuesChange(id, entries[0].id, values)
          )}
      </GroupeLabelWrapper>
    </>
  );
}

export default LegendGroupLabel;
