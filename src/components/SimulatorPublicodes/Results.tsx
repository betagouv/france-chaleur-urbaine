import React from 'react';

import { type SimulatorEngine } from './useSimulatorEngine';
type SimulatorResultsProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const SimulatorResults: React.FC<SimulatorResultsProps> = ({ children, className, engine, ...props }) => {
  const displayResult = (key: Parameters<typeof engine.getField>[0]) => (
    <div>
      {key}
      <strong>: {engine.getField(key)}</strong>
    </div>
  );

  return (
    <div className={className} {...props}>
      Ici, on retrouve les résultats
      <br />
      {displayResult('mode affichage')}
      {displayResult('département')}
    </div>
  );
};

export default SimulatorResults;
