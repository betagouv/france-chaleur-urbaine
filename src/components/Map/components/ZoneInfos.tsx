import Hoverable from '@components/Hoverable';
import { Button, Icon } from '@dataesr/react-dsfr';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Polygon } from 'geojson';
import { Map } from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';
import { useServices } from 'src/services';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { Summary } from 'src/types/Summary';
import { GasSummary } from 'src/types/Summary/Gas';
import ZoneInfo from './ZoneInfo';
import {
  CollapseZone,
  Container,
  Explanation,
  ExplanationTitle,
  Export,
  ZoneButton,
  ZoneInfosWrapper,
} from './ZoneInfos.style';

const getConso = (consos: GasSummary[]) => {
  const sum = consos.reduce((acc, current) => acc + current.conso_nb, 0);
  if (sum > 1000) {
    return `${(sum / 1000).toFixed(2)} GWh`;
  }

  return `${sum.toFixed(2)} MWh`;
};

const ZoneInfos = ({ map, draw }: { map: Map; draw: MapboxDraw }) => {
  const { heatNetworkService } = useServices();

  const zoneIndex = useRef(0);
  const [zoneCollapsed, setZoneCollapsed] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [bounds, setBounds] = useState<number[][]>();
  const [summary, setSummary] = useState<Summary>();

  useEffect(() => {
    setZoneCollapsed(window.innerWidth < 1251);
  }, []);

  useEffect(() => {
    if (map && draw) {
      map.on('draw.create', () => {
        const geometry = draw.getAll().features[0].geometry as Polygon;
        setBounds(geometry.coordinates[0]);
      });

      map.on('draw.update', () => {
        const geometry = draw.getAll().features[0].geometry as Polygon;
        setBounds(geometry.coordinates[0]);
      });

      map.on('draw.modechange', ({ mode }) => {
        if (mode === 'simple_select') {
          setDrawing(false);
        }
      });
    }
  }, [map, draw]);

  useEffect(() => {
    setSummary(undefined);
    if (bounds) {
      zoneIndex.current += 1;
      const currentZoneIndex = zoneIndex.current;
      heatNetworkService.summary(bounds).then((result) => {
        if (currentZoneIndex === zoneIndex.current) {
          setSummary(result);
        }
      });
    }
  }, [heatNetworkService, bounds]);

  const exportData = useCallback(async () => {
    if (bounds) {
      setExporting(true);
      await heatNetworkService.downloadSummary(bounds, EXPORT_FORMAT.CSV);
      setExporting(false);
    }
  }, [heatNetworkService, bounds]);

  return (
    <>
      <CollapseZone
        zoneCollapsed={zoneCollapsed}
        onClick={() => setZoneCollapsed(!zoneCollapsed)}
      >
        <Hoverable position="top-centered">
          {zoneCollapsed ? 'Afficher le panneau' : 'Masquer le panneau'}
        </Hoverable>
        <Icon
          size="xl"
          name={zoneCollapsed ? 'ri-arrow-up-s-fill' : 'ri-arrow-down-s-fill'}
        />
      </CollapseZone>
      {!zoneCollapsed && (
        <>
          {!drawing && (!bounds || summary) && (
            <ZoneButton
              icon="ri-edit-2-line"
              size="sm"
              onClick={() => {
                setBounds(undefined);
                setDrawing(true);
                draw.deleteAll();
                draw.changeMode('draw_polygon');
              }}
            >
              Définir une zone
            </ZoneButton>
          )}
          <Container customCursor={drawing}>
            <ZoneInfosWrapper>
              {drawing ? (
                <Explanation>
                  <div>
                    <Icon name="ri-pencil-line" size="lg" />
                    <ExplanationTitle>Définir une zone</ExplanationTitle>
                  </div>
                  <span>
                    Pour afficher et exporter des données, définissez une zone
                    en cliquant sur au moins trois points puis validez cette
                    zone en rejoignant le premier point.
                  </span>
                </Explanation>
              ) : bounds && !summary ? (
                <Explanation>
                  <div>
                    <Icon name="ri-timer-line" size="lg" />
                    <ExplanationTitle>Calcul en cours</ExplanationTitle>
                  </div>
                  <span>
                    Extraction des données correspondant à la zone définie en
                    cours (peut être long si la zone définie est trop grande)...
                  </span>
                </Explanation>
              ) : (
                <>
                  <ZoneInfo
                    color="blue"
                    title="Bâtiments à chauffage collectif fioul"
                    icon="fioul"
                    withBackground
                    values={[
                      {
                        label: 'Total',
                        value: summary
                          ? summary.energy.filter(
                              ({ energie_utilisee }) =>
                                energie_utilisee === 'fioul'
                            ).length
                          : '...',
                      },
                      {
                        label: 'Proche réseau (<50 m)',
                        value: summary
                          ? summary.energy
                              .filter((energy) => energy.is_close)
                              .filter(
                                ({ energie_utilisee }) =>
                                  energie_utilisee === 'fioul'
                              ).length
                          : '...',
                      },
                    ]}
                  />
                  <ZoneInfo
                    color="blue"
                    title="Bâtiments à chauffage collectif gaz"
                    icon="gaz"
                    withBackground
                    values={[
                      {
                        label: 'Total',
                        value: summary
                          ? summary.energy.filter(
                              ({ energie_utilisee }) =>
                                energie_utilisee === 'gaz'
                            ).length
                          : '...',
                      },
                      {
                        label: 'Proche réseau (<50 m)',
                        value: summary
                          ? summary.energy
                              .filter((energy) => energy.is_close)
                              .filter(
                                ({ energie_utilisee }) =>
                                  energie_utilisee === 'gaz'
                              ).length
                          : '...',
                      },
                    ]}
                  />
                  <ZoneInfo
                    color="blue"
                    title="Consommations de gaz"
                    values={[
                      {
                        label: 'Total',
                        value: summary ? getConso(summary.gas) : '...',
                      },
                      {
                        label: 'Proche réseau (<50 m)',
                        value: summary
                          ? getConso(summary.gas.filter((gas) => gas.is_close))
                          : '...',
                      },
                    ]}
                  />
                  <ZoneInfo
                    color="green"
                    alignTop
                    title="Réseaux de chaleur"
                    icon="traces"
                    values={[
                      {
                        label: 'Km',
                        value: summary
                          ? (
                              summary.network.reduce(
                                (acc, current) => acc + current.length,
                                0
                              ) / 1000
                            ).toFixed(2)
                          : '...',
                      },
                    ]}
                  />
                  <Export>
                    {exporting ? (
                      <Oval height={40} width={40} />
                    ) : (
                      <Button
                        size="sm"
                        icon={'ri-download-2-line'}
                        onClick={exportData}
                        disabled={!summary}
                      >
                        Exporter
                      </Button>
                    )}
                  </Export>
                </>
              )}
            </ZoneInfosWrapper>
          </Container>
        </>
      )}
    </>
  );
};

export default ZoneInfos;
