import { Icon } from '@dataesr/react-dsfr';
import { useState } from 'react';
import { MapCard } from './CardDetails.style';
import LegendEntry, { TypeLegendEntry } from './LegendEntry';
import LegendGroupLabel, { TypeGroupLegend } from './LegendGroupLabel';
import { LegendGlobalStyle } from './MapLegend.style';

function MapLegend({
  data,
  hasResults,
  layerDisplay,
  onToogleFeature,
  onToogleInGroup,
}: {
  data: (string | TypeGroupLegend)[];
  hasResults?: boolean;
  layerDisplay: Record<string, string[]>;
  onToogleFeature: (idEntry: any) => void;
  onToogleInGroup: (groupeName: string, idEntry: any) => void;
}) {
  const [legendPined, setLegendPined] = useState(false);

  return (
    <MapCard
      typeCard={'legend'}
      isClickable={hasResults}
      className={`legendCard ${!legendPined && hasResults ? 'close' : ''}`}
    >
      <LegendGlobalStyle />
      <header
        onClick={() => {
          if (hasResults) {
            setLegendPined(!legendPined);
          }
        }}
      >
        Légende
        {hasResults && (
          <Icon
            name={!legendPined ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
          />
        )}
      </header>

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
