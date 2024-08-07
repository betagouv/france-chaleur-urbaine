import React from 'react';

import { type SimulatorEngine } from './useSimulatorEngine';
type SimulatorResultsProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const SimulatorResults: React.FC<SimulatorResultsProps> = ({ children, className, engine, ...props }) => {
  const displayResult = (key: Parameters<typeof engine.getField>[0]) => {
    const rule = engine.getRule(key);

    return (
      <div>
        {key}
        <strong>
          : {engine.getField(key)}
          {rule.rawNode.unité ? ` ${rule.rawNode.unité}` : ''}
        </strong>
      </div>
    );
  };

  return (
    <div className={className} {...props}>
      Ici, on retrouve les résultats
      <h2 className="fr-mt-2w fr-mb-0">Paramètres généraux</h2>
      {displayResult('mode affichage')}
      {displayResult('type de bâtiment')}
      <h3 className="fr-mt-2w fr-mb-0">Département</h3>
      {displayResult('département')}
      {displayResult('code département')}
      {displayResult('degré jours unifié spécifique chaud')}
      {displayResult('degré jours unifié spécifique froid')}
      {displayResult('zone climatique')}
      {displayResult('température de référence chaud')}
      {displayResult('augmenter la température de chauffe')}
      <h2>Autre</h2>
    </div>
  );
};

export default SimulatorResults;
