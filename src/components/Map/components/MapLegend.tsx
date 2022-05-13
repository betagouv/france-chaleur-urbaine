import React, { useState } from 'react';
import { MapCard } from './CardDetails.style';
import LegendEntry, { TypeLegendEntry } from './LegendEntry';
import LegendGroupLabel, { TypeGroupLegend } from './LegendGroupLabel';
import { LegendGlobalStyle } from './MapLegend.style';

function MapLegend({
  data,
  forceClosed,
  layerDisplay,
  onToogleFeature,
  onToogleInGroup,
}: {
  data: (string | TypeGroupLegend)[];
  forceClosed?: boolean;
  layerDisplay: Record<string, string[]>;
  onToogleFeature: (idEntry: any) => void;
  onToogleInGroup: (groupeName: string, idEntry: any) => void;
}) {
  const [legendOpened, setLegendOpened] = useState(true);

  return (
    <MapCard
      typeCard={'legend'}
      isClosable
      className={
        !legendOpened || forceClosed ? 'legendCard close' : 'legendCard'
      }
    >
      <LegendGlobalStyle />
      <header onClick={() => setLegendOpened(!legendOpened)}>Légende</header>

      <section>
        {data.map((group, i) => {
          if (group === 'separator') return <hr key={`separator-${i}`} />;
          else if (typeof group === 'object') {
            const { id, title, entries, description, type = 'list' } = group;
            if (type === 'group') {
              return (
                <LegendGroupLabel
                  layerDisplay={layerDisplay}
                  key={`group-${id}`}
                  id={id}
                  title={title}
                  description={description}
                  entries={entries}
                  onChangeEntry={onToogleInGroup}
                />
              );
            } else if (type === 'list') {
              return entries.map((entry: TypeLegendEntry) => (
                <LegendEntry
                  checked={!!layerDisplay?.[entry.id]}
                  key={entry.id}
                  onChange={onToogleFeature}
                  {...entry}
                />
              ));
            }
          } else return null;
        })}
      </section>
    </MapCard>
  );
}

export default MapLegend;
