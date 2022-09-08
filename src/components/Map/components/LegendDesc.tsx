import React from 'react';
import { themeDefEnergy } from 'src/services/Map/businessRules';
import DPELegend from './DPELegend';
import ScaleLegend from './ScaleLegend';

export const LegendDeskData = {
  energy: [
    { label: '<\u00a030', mapCase: { ope: '<', value: 30 }, size: 11 },
    {
      label: '30\u00a0à\u00a0100',
      mapCase: { ope: '<', value: 100 },
      size: 18,
    },
    { label: '>\u00a0100', mapCase: { ope: '>', value: 100 }, size: 23 },
  ],
  gasUsage: [
    { label: '<\u00a0100', mapCase: { ope: '<', value: 100 }, size: 12 },
    {
      label: '100\u00a0à\u00a01000',
      mapCase: { ope: '<', value: 1000 },
      size: 18,
    },
    { label: '>\u00a01000', mapCase: { ope: '>', value: 1000 }, size: 29 },
  ],
};

const LegendDesc: Record<string, () => React.ReactElement> = {
  EnergyGas: () => (
    <ScaleLegend
      label="Nombre de lots d'habitation"
      color={`${themeDefEnergy.gas.color}88`}
      scaleLabels={LegendDeskData.energy}
    />
  ),
  EnergyFuel: () => (
    <ScaleLegend
      label="Nombre de lots d'habitation"
      color={`${themeDefEnergy.fuelOil.color}88`}
      scaleLabels={LegendDeskData.energy}
    />
  ),
  GasUsage: () => (
    <ScaleLegend
      circle
      label="Niveau de consommation de gaz (MWh)"
      color="#D9D9D9"
      scaleLabels={LegendDeskData.gasUsage}
    />
  ),
  DPE: () => <DPELegend />,
};

export default LegendDesc;
