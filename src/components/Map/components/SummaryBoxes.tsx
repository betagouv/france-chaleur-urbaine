import Hoverable from '@components/Hoverable';
import { Button, Icon, Tab, Tabs } from '@dataesr/react-dsfr';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import turfArea from '@turf/area';
import turfLength from '@turf/length';
import { LineString, Polygon } from 'geojson';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';
import { MapRef } from 'react-map-gl/maplibre';
import { useServices } from 'src/services';
import { Summary } from 'src/types/Summary';
import { Densite } from 'src/types/Summary/Densite';
import { GasSummary } from 'src/types/Summary/Gas';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import {
  CollapseZone,
  DrawButton,
  DrawButtons,
  Explanation,
  Export,
  InfoIcon,
  ZoneInfos,
  ZoneInfosWrapper,
} from './SummaryBoxes.style';
import ZoneInfo from './ZoneInfo';
import { clientConfig } from 'src/client-config';
import { trackEvent } from 'src/services/analytics';
import { downloadObject } from '@utils/browser';
import { formatAsISODate } from '@utils/date';
import { lineStrings } from '@turf/helpers';

const getConso = (consos: GasSummary[]) => {
  const sum = consos.reduce((acc, current) => acc + current.conso_nb, 0);
  if (sum > 1000) {
    return `${(sum / 1000).toFixed(2)} GWh`;
  }

  return `${sum.toFixed(2)} MWh`;
};

const getDensite = (size: number, densite: GasSummary[]) => {
  if (densite.length === 0) {
    return '0 MWh/m';
  }
  const value =
    densite.reduce((acc, value) => acc + value.conso_nb, 0) / (size * 1000);
  if (value > 1000) {
    return `${(value / 1000).toFixed(2)} GWh/m`;
  }

  return `${value.toFixed(2)} MWh/m`;
};

const SummaryBoxes = ({
  map,
  draw,
  setDrawing,
}: {
  map: MapRef;
  draw: MapboxDraw;
  setDrawing: Dispatch<SetStateAction<boolean>>;
}) => {
  const { heatNetworkService } = useServices();

  const zoneIndex = useRef(0);
  const lineIndex = useRef(0);
  const [tabIndex, setTabIndex] = useState(0);
  const [zoneCollapsed, setZoneCollapsed] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [size, setSize] = useState<number>();
  const [bounds, setBounds] = useState<number[][]>();
  const [lines, setLines] = useState<number[][][]>();
  const [summary, setSummary] = useState<Summary>();
  const [densite, setDensite] = useState<Densite>();

  useEffect(() => {
    setZoneCollapsed(window.innerWidth < 1251);
  }, []);

  useEffect(() => {
    setSummary(undefined);
    if (bounds && size && size < clientConfig.summaryAreaSizeLimit) {
      trackEvent('Carto|Zone définie');
      zoneIndex.current += 1;
      const currentZoneIndex = zoneIndex.current;
      heatNetworkService.summary(bounds).then((result) => {
        trackEvent('Carto|Donées recues');
        if (currentZoneIndex === zoneIndex.current) {
          setSummary(result);
        }
      });
    }
  }, [heatNetworkService, bounds, size]);

  useEffect(() => {
    setDensite(undefined);
    if (lines) {
      trackEvent('Carto|Tracé défini');
      if (tabIndex === 1) {
        // densité thermique linéaire
        lineIndex.current += 1;
        const currentLineIndex = lineIndex.current;

        heatNetworkService.densite(lines).then((result) => {
          trackEvent('Carto|Densité recu');
          if (currentLineIndex === lineIndex.current) {
            setDensite(result);
          }
        });
      } else {
        // mesure de distance
      }
    }
  }, [heatNetworkService, lines]);

  const exportData = async (bounds: number[][]) => {
    if (bounds) {
      try {
        setExporting(true);
        await heatNetworkService.downloadSummary(bounds, EXPORT_FORMAT.CSV);
      } finally {
        setExporting(false);
      }
    }
  };

  useEffect(() => {
    if (map && draw) {
      map.on('draw.create', () => {
        const data = draw.getAll();
        if (data.features[0].geometry.type === 'Polygon') {
          const geometry = data.features[0].geometry as Polygon;
          setBounds(geometry.coordinates[0]);
          setSize(turfArea(data) / 1000_000);
        } else if (data.features[0].geometry.type === 'LineString') {
          setLines(
            data.features.map((feature) => {
              return (feature.geometry as LineString).coordinates;
            })
          );
        }
      });

      map.on('draw.update', () => {
        const data = draw.getAll();
        if (data.features[0].geometry.type === 'Polygon') {
          trackEvent('Carto|Zone mise à jour');
          const geometry = data.features[0].geometry as Polygon;
          setBounds(geometry.coordinates[0]);
          setSize(turfArea(data) / 1_000_000);
        } else if (data.features[0].geometry.type === 'LineString') {
          trackEvent('Carto|Tracé mis à jour');
          setLines(
            data.features.map((feature) => {
              return (feature.geometry as LineString).coordinates;
            })
          );
        }
      });

      map.on('draw.modechange', ({ mode }) => {
        if (mode === 'simple_select') {
          setDrawing(false);
        }
      });
    }
  }, [map, draw, setDrawing]);

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
          size="2x"
          name={zoneCollapsed ? 'ri-arrow-up-s-fill' : 'ri-arrow-down-s-fill'}
        />
      </CollapseZone>
      {!zoneCollapsed && (
        <>
          <ZoneInfosWrapper>
            <Tabs
              onChange={(index) => {
                setTabIndex(index);
              }}
            >
              <Tab label="Extraire des données sur les bâtiments">
                {size && size > clientConfig.summaryAreaSizeLimit ? (
                  <Explanation>
                    <span>
                      La zone définie est trop grande ({size.toFixed(2)} km²),
                      veuillez réduire la taille de recherche (maximum 5 km²).
                      Si vous avez besoin de statistiques sur une zone élargie
                      ou plus précise, n'hésitez pas à{' '}
                      <a
                        href="mailto:france-chaleur-urbaine@developpement-durable.gouv.fr"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        nous contacter
                      </a>
                    </span>
                  </Explanation>
                ) : bounds && !summary ? (
                  <Explanation>
                    Extraction des données correspondant à la zone définie en
                    cours...
                  </Explanation>
                ) : !summary ? (
                  <Explanation>
                    Pour afficher et exporter des données sur une zone
                    (consommation de gaz, adresse des bâtiments chauffés au gaz
                    ou fioul collectif,...), cliquez sur au moins trois points
                    puis validez cette zone en rejoignant le premier point.
                  </Explanation>
                ) : (
                  <ZoneInfos>
                    <ZoneInfo
                      color="blue"
                      title="Bâtiments à chauffage collectif fioul"
                      icon="fioul"
                      withBackground
                      values={[
                        {
                          label: 'Total',
                          value: summary.energy.filter(
                            ({ energie_utilisee }) =>
                              energie_utilisee === 'fioul'
                          ).length,
                        },
                        {
                          label: 'Proche réseau (<50 m)',
                          value: summary.energy
                            .filter((energy) => energy.is_close)
                            .filter(
                              ({ energie_utilisee }) =>
                                energie_utilisee === 'fioul'
                            ).length,
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
                          value: summary.energy.filter(
                            ({ energie_utilisee }) => energie_utilisee === 'gaz'
                          ).length,
                        },
                        {
                          label: 'Proche réseau (<50 m)',
                          value: summary.energy
                            .filter((energy) => energy.is_close)
                            .filter(
                              ({ energie_utilisee }) =>
                                energie_utilisee === 'gaz'
                            ).length,
                        },
                      ]}
                    />
                    <ZoneInfo
                      color="blue"
                      title="Consommations de gaz"
                      values={[
                        {
                          label: 'Total',
                          value: getConso(summary.gas),
                        },
                        {
                          label: 'Proche réseau (<50 m)',
                          value: getConso(
                            summary.gas.filter((gas) => gas.is_close)
                          ),
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
                          value: (
                            summary.network.reduce(
                              (acc, current) => acc + current.length,
                              0
                            ) / 1000
                          ).toFixed(2),
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
                          onClick={() => bounds && exportData(bounds)}
                          disabled={!summary}
                        >
                          Exporter
                        </Button>
                      )}
                    </Export>
                  </ZoneInfos>
                )}
              </Tab>
              <Tab label="Calculer une densité thermique linéaire">
                {lines && !densite ? (
                  <>
                    Extraction des données correspondant au tracé défini en
                    cours...
                  </>
                ) : !densite ? (
                  <>
                    Pour calculer une distance et la densité thermique linéaire
                    associée, définissez un tracé en cliquant sur deux points ou
                    plus, puis validez en cliquant sur entrée. Vous pouvez alors
                    ajouter des segments à votre tracé, ou en retirez. Vous
                    pouvez aussi cliquer sur les points pour les déplacer.
                  </>
                ) : (
                  <ZoneInfos>
                    <ZoneInfo
                      color="green"
                      alignTop
                      title="Distance"
                      values={[
                        {
                          label: 'm',
                          value: Math.round(densite.size * 1000),
                        },
                      ]}
                    />
                    <ZoneInfo
                      color="blue"
                      alignTop
                      title="Consommations de gaz"
                      values={[
                        {
                          label: 'à 10m',
                          value: getConso(densite.data[10]),
                        },
                        {
                          label: 'à 50m',
                          value: getConso(densite.data[50]),
                        },
                      ]}
                    />
                    <ZoneInfo
                      color="blue"
                      alignTop
                      title={
                        <>
                          Densité thermique linéaire
                          <InfoIcon>
                            <Icon size="lg" name="ri-information-fill" />
                            <Hoverable>
                              Densité thermique calculée sur la base des
                              consommations de gaz à l'adresse situées à une
                              distance de 10 ou 50 m du tracé défini
                            </Hoverable>
                          </InfoIcon>
                        </>
                      }
                      values={[
                        {
                          label: 'à 10m',
                          value: getDensite(densite.size, densite.data[10]),
                        },
                        {
                          label: 'à 50m',
                          value: getDensite(densite.size, densite.data[50]),
                        },
                      ]}
                    />

                    <Button
                      size="sm"
                      icon={'ri-download-2-line'}
                      onClick={() => {
                        downloadObject(
                          draw.getAll(),
                          `FCU_export_tracé_${formatAsISODate(
                            new Date()
                          )}.geojson`,
                          'application/geo+json'
                        );
                      }}
                      disabled={!densite}
                      className="fr-col--middle"
                    >
                      Exporter le tracé
                    </Button>
                  </ZoneInfos>
                )}
              </Tab>
              <Tab label="Mesurer une distance">
                {!lines ? (
                  <>
                    Dessinez un tracé sur la carte afin d'obtenir sa longueur.
                  </>
                ) : (
                  <>
                    Distance totale :{' '}
                    {Math.round(turfLength(lineStrings(lines)) * 1000)}m
                  </>
                )}
              </Tab>
            </Tabs>
            {((size && size > 5) ||
              (tabIndex === 0 && (!bounds || summary))) && (
              <DrawButton
                size="sm"
                icon="ri-edit-2-line"
                onClick={() => {
                  draw.deleteAll();
                  setBounds(undefined);
                  setLines(undefined);
                  trackEvent('Carto|Définir une zone');
                  setDrawing(true);
                  draw.changeMode('draw_polygon');
                }}
              >
                Définir une zone
              </DrawButton>
            )}
            {tabIndex === 1 && densite && (
              <DrawButtons>
                <Button
                  size="sm"
                  icon="ri-edit-2-line"
                  onClick={() => {
                    draw.deleteAll();
                    setBounds(undefined);
                    setLines(undefined);
                    trackEvent('Carto|Définir un tracé');
                    setDrawing(true);
                    draw.changeMode('draw_line_string');
                  }}
                >
                  Définir un nouveau tracé
                </Button>
                <Button
                  className="hideable"
                  size="sm"
                  icon="ri-add-line"
                  onClick={() => {
                    setDrawing(true);
                    trackEvent('Carto|Ajouter un segment');
                    draw.changeMode('draw_line_string');
                  }}
                >
                  Ajouter un segment
                </Button>
                <Button
                  className="hideable"
                  size="sm"
                  icon="ri-close-line"
                  onClick={() => {
                    const selected = draw.getSelectedIds();
                    if (selected.length > 0) {
                      trackEvent('Carto|Supprimer un segment');
                      const all = draw.getAll();
                      draw.delete(selected);
                      setLines(
                        all.features
                          .filter(
                            (feature) =>
                              !selected.includes(feature.id as string)
                          )
                          .map((feature) => {
                            return (feature.geometry as LineString).coordinates;
                          })
                      );
                    }
                  }}
                >
                  Supprimer le segment
                </Button>
              </DrawButtons>
            )}
            {tabIndex === 1 && !lines && (
              <DrawButton
                size="sm"
                icon="ri-edit-2-line"
                onClick={() => {
                  draw.deleteAll();
                  setBounds(undefined);
                  setLines(undefined);
                  trackEvent('Carto|Définir un tracé');
                  setDrawing(true);
                  draw.changeMode('draw_line_string');
                }}
              >
                Définir un tracé
              </DrawButton>
            )}

            {tabIndex === 2 && (
              <DrawButton
                size="sm"
                icon="ri-edit-2-line"
                onClick={() => {
                  draw.deleteAll();
                  setBounds(undefined);
                  setLines(undefined);
                  trackEvent('Carto|Définir un tracé');
                  setDrawing(true);
                  draw.changeMode('draw_line_string');
                }}
              >
                Définir un tracé
              </DrawButton>
            )}
          </ZoneInfosWrapper>
        </>
      )}
    </>
  );
};

export default SummaryBoxes;
