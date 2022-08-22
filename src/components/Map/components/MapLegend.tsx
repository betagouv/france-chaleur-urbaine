import { Button, Link } from '@dataesr/react-dsfr';
import { useRouter } from 'next/router';
import { TypeGroupLegend } from 'src/types/TypeGroupLegend';
import { TypeLayerDisplay } from '../../../services/Map/param';
import { LegendSeparator } from '../Map.style';
import LegendEntry, { TypeLegendEntry } from './LegendEntry';
import LegendGroupLabel from './LegendGroupLabel';
import { LegendButton, LegendGlobalStyle, Sources } from './MapLegend.style';

function MapLegend({
  data,
  layerDisplay,
  onToogleFeature,
  onToogleInGroup,
}: {
  data: (string | TypeGroupLegend)[];
  hasResults?: boolean;
  layerDisplay: TypeLayerDisplay;
  onToogleFeature: (idEntry: any) => void;
  onToogleInGroup: (groupeName: string, idEntry: any) => void;
}) {
  const router = useRouter();
  return (
    <>
      <LegendGlobalStyle />
      {data.map((group, i) => {
        if (group === 'separator') {
          return <LegendSeparator key={`separator-${i}`} />;
        }

        if (group === 'contributeButton') {
          return (
            <LegendButton key="contribute-button">
              <Button
                icon="ri-upload-2-line"
                onClick={() => router.push('/contribution')}
                size="sm"
              >
                Contribuer
              </Button>
            </LegendButton>
          );
        }

        if (group === 'sources') {
          return (
            <Sources>
              <Link key={'sources'} href="/carto_sources.pdf" target="_blank">
                Sources
              </Link>
            </Sources>
          );
        }

        if (typeof group === 'object') {
          const {
            id,
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
                key={`group-${id}-${subLegend}`}
                id={id}
                subLegend={subLegend}
                subGroup={subGroup}
                entries={entries}
                linkto={linkto}
                onChangeEntry={onToogleInGroup}
              />
            );
          }

          if (type === 'list') {
            return entries.map((entry: TypeLegendEntry) => (
              <LegendEntry
                checked={!!layerDisplay[entry.id]}
                key={entry.id}
                onChange={onToogleFeature}
                {...entry}
              />
            ));
          }
        }
        return null;
      })}
    </>
  );
}

export default MapLegend;
