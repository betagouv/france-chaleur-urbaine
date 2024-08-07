import React from 'react';

import { type SimulatorEngine } from './useSimulatorEngine';
type SimulatorResultsProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const SimulatorResults: React.FC<SimulatorResultsProps> = ({ children, className, engine, ...props }) => {
  const displayResult = (key: Parameters<typeof engine.getField>[0], calculated = true) => {
    const rule = engine.getRule(key);
    const value = engine.getField(key);
    const valueType = typeof value;
    const result =
      valueType === 'number' ? (
        value.toLocaleString('en')
      ) : valueType === 'string' ? (
        value
      ) : (
        <pre style={{ display: 'inline-block' }}>{JSON.stringify(value, null, 2)}</pre>
      );
    return (
      <div>
        {calculated ? '🔄' : '✏️'} {key}
        <strong>
          : {result as any}
          {rule.rawNode.unité ? ` ${rule.rawNode.unité}` : ''}
        </strong>{' '}
        <small>{valueType}</small>
      </div>
    );
  };

  return (
    <div className={className} {...props}>
      Ici, on retrouve les résultats
      <h2 className="fr-mt-2w fr-mb-0">Paramètres généraux</h2>
      {displayResult('mode affichage', false)}
      {displayResult('type de bâtiment', false)}
      <h3 className="fr-mt-2w fr-mb-0">Département</h3>
      {displayResult('code département', false)}
      {displayResult('nom département')}
      {displayResult('degré jours unifié spécifique chaud')}
      {displayResult('degré jours unifié spécifique froid')}
      {displayResult('zone climatique')}
      {displayResult('température de référence chaud')}
      {displayResult('augmenter la température de chauffe')}
      <h2 className="fr-mt-2w fr-mb-0">Paramètres Réseaux de chaleur et de froid</h2>
      {displayResult('choix du réseau de chaleur', false)}
      {displayResult('contenu CO2 réseau de chaleur')}
      {displayResult('choix du réseau de froid', false)}
      {displayResult('contenu CO2 réseau de froid')}
      <h2 className="fr-mt-2w fr-mb-0">Besoins et choix du bâtiment</h2>
      {displayResult("nombre de logement dans l'immeuble concerné", false)}
      {displayResult('surface logement type tertiaire', false)}
      {displayResult("Nombre d'habitants moyen par appartement", false)}
      {displayResult('Production eau chaude sanitaire', false)}
      <h2 className="fr-mt-2w fr-mb-0">Autre</h2>
    </div>
  );
};

export default SimulatorResults;
