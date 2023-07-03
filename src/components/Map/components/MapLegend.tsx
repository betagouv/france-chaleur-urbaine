import { Button, Link } from '@dataesr/react-dsfr';
import { useRouter } from 'next/router';
import { TypeGroupLegend } from 'src/types/TypeGroupLegend';
import { TypeLayerDisplay } from '../../../services/Map/param';
import { LegendSeparator } from '../Map.style';
import { Title } from './DPELegend.style';
import LegendEntry, { TypeLegendEntry } from './LegendEntry';
import { LabelLegendHead } from './LegendEntry.styled';
import LegendGroupLabel from './LegendGroupLabel';
import { LegendButton, LegendGlobalStyle, Sources } from './MapLegend.style';

function MapLegend({
  data,
  layerDisplay,
  legendTitle,
  onToogleFeature,
  onToogleInGroup,
  onValuesChange,
}: {
  data: (string | TypeGroupLegend)[];
  hasResults?: boolean;
  layerDisplay: TypeLayerDisplay;
  legendTitle?: string;
  onToogleFeature: (idEntry: any) => void;
  onToogleInGroup: (groupeName: string, idEntry: string) => void;
  onValuesChange?: (
    groupeName: string,
    idEntry: string,
    values: [number, number]
  ) => void;
}) {
  const router = useRouter();
  return (
    <>
      <LegendGlobalStyle />
      <LabelLegendHead fullWidth>
        {legendTitle || 'Réseaux de chaleur et de froid'}
      </LabelLegendHead>
      <Title className="fr-mb-1w">
        Cliquer sur un réseau pour connaître ses caractéristiques
      </Title>
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
            <Sources key={'sources'}>
              <Link href="/documentation/carto_sources.pdf" target="_blank">
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
                onValuesChange={onValuesChange}
              />
            );
          }

          if (type === 'list') {
            return entries.map((entry: TypeLegendEntry) => (
              <div className="fr-mt-1w" key={entry.id}>
                <LegendEntry
                  checked={!!layerDisplay[entry.id]}
                  onChange={onToogleFeature}
                  subLegend={subLegend}
                  {...entry}
                />
              </div>
            ));
          }
        }
        return null;
      })}
    </>
  );
}

export default MapLegend;
