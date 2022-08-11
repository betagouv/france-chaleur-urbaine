import { Button, ButtonGroup } from '@dataesr/react-dsfr';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { Polygon } from 'geojson';
import { Map } from 'maplibre-gl';
import { useCallback, useEffect, useState } from 'react';
import { useServices } from 'src/services';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { Summary } from 'src/types/Summary';
import { typeEnergy } from '../Map.style';
import ZoneInfo from './ZoneInfo';
import { Container, ExportButton, ZoneInfosWrapper } from './ZoneInfos.style';

const ZoneInfos = ({ map, draw }: { map: Map; draw: MapboxDraw }) => {
  const { heatNetworkService } = useServices();

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
      heatNetworkService.summary(bounds).then(setSummary);
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
      <ButtonGroup isInlineFrom="xs" size="sm" align="center">
        <Button
          icon="ri-search-line"
          secondary
          onClick={() => {
            draw.deleteAll();
            const bounds = map.getBounds();
            setBounds([
              bounds.getNorthEast().toArray(),
              bounds.getNorthWest().toArray(),
              bounds.getSouthWest().toArray(),
              bounds.getSouthEast().toArray(),
              bounds.getNorthEast().toArray(),
            ]);
          }}
        >
          Actualiser dans cette zone
        </Button>
        <Button
          icon="ri-edit-2-line"
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
      </ButtonGroup>
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
                    (x) => typeEnergy[x.energie_utilisee] === 'fuelOil'
                  ).length,
                },
                {
                  label: 'Proche réseau (<50 m)',
                  value: summary.closeEnergy.filter(
                    (x) => typeEnergy[x.energie_utilisee] === 'fuelOil'
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
                    (x) => typeEnergy[x.energie_utilisee] === 'gas'
                  ).length,
                },
                {
                  label: 'Proche réseau (<50 m)',
                  value: summary.closeEnergy.filter(
                    (x) => typeEnergy[x.energie_utilisee] === 'gas'
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
                      (acc, current) => acc + current.conso,
                      0
                    ) / 1000
                  ).toFixed(2)} GWh`,
                },
                {
                  label: 'Proche réseau (<50 m)',
                  value: `${(
                    summary.closeGas.reduce(
                      (acc, current) => acc + current.conso,
                      0
                    ) / 1000
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
            <ExportButton
              size="sm"
              icon="ri-download-2-line"
              onClick={exportData}
              disabled={exporting}
            >
              Exporter
            </ExportButton>
          </>
        ) : (
          <span>
            {bounds
              ? 'Calcul des statistiques en cours (peut être long si la zone définie est trop grande)...'
              : 'Pour afficher et exporter des données sur les modes de chauffage, consommations de gaz et réseaux de chaleur, zoomez sur une zone ou tracez une zone sur la carte.'}
          </span>
        )}
      </ZoneInfosWrapper>
    </Container>
  );
};

export default ZoneInfos;
