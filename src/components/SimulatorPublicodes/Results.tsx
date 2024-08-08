import Accordion from '@codegouvfr/react-dsfr/Accordion';
import React from 'react';

import Debug from './Debug';
import Graph from './Graph';
import { type SimulatorEngine } from './useSimulatorEngine';

type SimulatorResultsProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const SimulatorResults: React.FC<SimulatorResultsProps> = ({ children, className, engine, ...props }) => {
  return (
    <div className={className} {...props}>
      Ici, on retrouve les résultats
      <Graph engine={engine} />
      <Accordion label="Debug">
        <Debug engine={engine} style={{ maxHeight: '800px', overflow: 'auto' }} />
      </Accordion>
    </div>
  );
};

export default SimulatorResults;
