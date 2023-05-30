import React from 'react';
import { themeDefEnergy } from 'src/services/Map/businessRules';
import { defaultLayerDisplay } from 'src/services/Map/param';
import DPELegend from './DPELegend';
import FuturRDCLegend from './FuturRDCLegend';
import RDCLegend from './RDCLegend';
import ScaleLegend from './ScaleLegend';

export const minIconSize = 12;
export const maxIconSize = 30;

export const LegendDeskData = {
  energy: {
    min: 10,
    max: 150,
  },
  gasUsage: {
    min: 50,
    max: 2000,
  },
};

const LegendDesc: Record<
  string,
  (onValuesChange?: (values: [number, number]) => void) => React.ReactElement
> = {
  EnergyGas: (onValuesChange) => (
    <ScaleLegend
      label="Nombre de lots d'habitation"
      color={themeDefEnergy.gas.color}
      domain={[LegendDeskData.energy.min, LegendDeskData.energy.max]}
      defaultValues={defaultLayerDisplay.energyGasValues}
      onChange={(values) => onValuesChange && onValuesChange(values)}
    />
  ),
  EnergyFuel: (onValuesChange) => (
    <ScaleLegend
      label="Nombre de lots d'habitation"
      color={themeDefEnergy.fuelOil.color}
      domain={[LegendDeskData.energy.min, LegendDeskData.energy.max]}
      defaultValues={defaultLayerDisplay.energyFuelValues}
      onChange={(values) => onValuesChange && onValuesChange(values)}
    />
  ),
  GasUsage: (onValuesChange) => (
    <ScaleLegend
      circle
      label="Niveau de consommation de gaz (MWh)"
      color="#D9D9D9"
      defaultValues={defaultLayerDisplay.gasUsageValues}
      domain={[LegendDeskData.gasUsage.min, LegendDeskData.gasUsage.max]}
      onChange={(values) => onValuesChange && onValuesChange(values)}
    />
  ),
  DPE: () => <DPELegend />,
  RDC: () => <RDCLegend />,
  FuturRDC: () => <FuturRDCLegend />,
};

export default LegendDesc;
