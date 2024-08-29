import React from 'react';

import Graph from './Graph';
import { type SimulatorEngine } from './useSimulatorEngine';

type SimulatorResultsProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const SimulatorResults: React.FC<SimulatorResultsProps> = ({ children, engine, ...props }) => {
  return (
    <div {...props}>
      <Graph engine={engine} />
    </div>
  );
};

export default SimulatorResults;
