import { Button } from '@dataesr/react-dsfr';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Polygon } from 'geojson';
import { Map } from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Oval } from 'react-loader-spinner';
import { useServices } from 'src/services';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { Summary } from 'src/types/Summary';
import ZoneInfo from './ZoneInfo';
import { Container, Export, ZoneInfosWrapper } from './ZoneInfos.style';

const ZoneInfos = ({ map, draw }: { map: Map; draw: MapboxDraw }) => {
  const { heatNetworkService } = useServices();

  const zoneIndex = useRef(0);
  const [customCursor, setCustomCursor] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bounds, setBounds] = useState<number[][]>();
  const [summary, setSummary] = useState<Summary>();

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
          setCustomCursor(false);
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
    <Container customCursor={customCursor}>
      <Button
        icon="ri-edit-2-line"
        size="sm"
        secondary
        onClick={() => {
          setBounds(undefined);
          setCustomCursor(true);
          draw.deleteAll();
          draw.changeMode('draw_polygon');
        }}
      >
        Définir une zone
      </Button>
      <ZoneInfosWrapper>
        {summary ? (
          <>
            <ZoneInfo
              color="blue"
              title="Bâtiments à chauffage collectif fioul"
              icon="fioul"
              withBackground
              values={[
                {
                  label: 'Total',
                  value: summary.energy.filter(
                    ({ energie_utilisee }) => energie_utilisee === 'fioul'
                  ).length,
                },
                {
                  label: 'Proche réseau (<50 m)',
                  value: summary.energy
                    .filter((energy) => energy.is_close)
                    .filter(
                      ({ energie_utilisee }) => energie_utilisee === 'fioul'
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
                      ({ energie_utilisee }) => energie_utilisee === 'gaz'
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
                  value: `${(
                    summary.gas.reduce(
                      (acc, current) => acc + +current.conso_nb,
                      0
                    ) / 1000
                  ).toFixed(2)} GWh`,
                },
                {
                  label: 'Proche réseau (<50 m)',
                  value: `${(
                    summary.gas
                      .filter((gas) => gas.is_close)
                      .reduce((acc, current) => acc + +current.conso_nb, 0) /
                    1000
                  ).toFixed(2)} GWh`,
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
                  onClick={exportData}
                >
                  Exporter
                </Button>
              )}
            </Export>
          </>
        ) : (
          <span>
            {bounds
              ? 'Calcul des statistiques en cours (peut être long si la zone définie est trop grande)...'
              : 'Pour afficher et exporter des données sur les modes de chauffage, consommations de gaz et réseaux de chaleur, définissez une zone en cliquant sur au moins trois points puis en appuyant sur "Entrée".'}
          </span>
        )}
      </ZoneInfosWrapper>
    </Container>
  );
};

export default ZoneInfos;
