import React from 'react';
import { themeDefEnergy } from '../businessRules';
import ScaleLegend from './ScaleLegend';

const LegendDesc: Record<string, () => React.ReactElement> = {
  Energy: () => (
    <ScaleLegend
      label="Nombre de lots d'habitation"
      color={themeDefEnergy.gas.color}
      scaleLabels={[
        { label: '<\u00a0100', size: 0.5 },
        { label: '100\u00a0à\u00a01000', size: 1 },
        { label: '>\u00a01000', size: 2 },
      ]}
    />
  ),
  EnergyGas: () => (
    <ScaleLegend
      label="Nombre de lots d'habitation"
      color={`${themeDefEnergy.gas.color}88`}
      scaleLabels={[
        { label: '<\u00a0100', size: 0.8 },
        { label: '100\u00a0à\u00a01000', size: 1.3 },
        { label: '>\u00a01000', size: 2 },
      ]}
    />
  ),
  EnergyFuel: () => (
    <ScaleLegend
      label="Nombre de lots d'habitation"
      color={`${themeDefEnergy.fuelOil.color}88`}
      scaleLabels={[
        { label: '<\u00a0100', size: 0.8 },
        { label: '100\u00a0à\u00a01000', size: 1.3 },
        { label: '>\u00a01000', size: 2 },
      ]}
    />
  ),
  GasUsage: () => (
    <ScaleLegend
      circle
      label="Niveau de consommation de gaz (MWh)"
      color="#D9D9D9"
      scaleLabels={[
        { label: '<\u00a0100', size: 0.8 },
        { label: '100\u00a0à\u00a01000', size: 1.3 },
        { label: '>\u00a01000', size: 2 },
      ]}
    />
  ),
};

export default LegendDesc;
