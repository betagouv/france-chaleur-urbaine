import { useState } from 'react';
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
      className={`legendCard ${!legendOpened || forceClosed ? 'close' : ''}`}
    >
      <LegendGlobalStyle />
      <header onClick={() => setLegendOpened(!legendOpened)}>Légende</header>

      <section>
        {data.map((group, i) => {
          if (group === 'separator') return <hr key={`separator-${i}`} />;
          else if (typeof group === 'object') {
            const {
              id,
              title,
              description,
              subGroup,
              entries,
              subLegend,
              linkto,
              type = 'list',
            } = group;
            if (type === 'group') {
              return (
                <LegendGroupLabel
                  layerDisplay={layerDisplay}
                  key={`group-${id}-${i}`}
                  id={id}
                  title={title}
                  subLegend={subLegend}
                  description={description}
                  subGroup={subGroup}
                  entries={entries}
                  linkto={linkto}
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
