import React from 'react';
import ScaleLegend from './ScaleLegend';

// TODO: Move to MapData.ts ?
const LegendDesc: Record<string, () => React.ReactElement> = {
  Energy: () => (
    <ScaleLegend
      framed
      label="Nombre de lots d'habitation"
      color="#afafaf"
      scaleLabels={[
        { label: '< 100', size: 0.5 },
        { label: '100 à 1000', size: 1 },
        { label: '> 1000', size: 2 },
      ]}
    />
  ),
  GasUsage: () => (
    <ScaleLegend
      framed
      label="Niveau de consomation de gaz (MWh)"
      color="#afafaf"
      scaleLabels={[
        { label: '< 100', size: 0.5 },
        { label: '100 à 1000', size: 1 },
        { label: '> 1000', size: 2 },
      ]}
    />
  ),
};

export default LegendDesc;
