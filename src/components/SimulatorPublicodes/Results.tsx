import React from 'react';

import { type SimulatorEngine } from './useSimulatorEngine';
type SimulatorResultsProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const SimulatorResults: React.FC<SimulatorResultsProps> = ({ children, className, engine, ...props }) => {
  const [showRuleDetails, setShowRuleDetails] = React.useState<Record<string, boolean>>({});

  const toggleRuleDetails = (key: string) => {
    setShowRuleDetails((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
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
      <>
        <div style={{ padding: '0.5rem' }}>
          {calculated ? '🔄' : '✏️'} {key}:
          <strong style={{ border: '1px solid', padding: '0 0.5rem', minWidth: '100px', display: 'inline-block' }}>
            {result as any}
            {rule.rawNode.unité ? ` ${rule.rawNode.unité}` : ''}
          </strong>{' '}
          <small style={{ display: 'inline-block', marginLeft: '1rem' }}>{valueType}</small>
          <small
            style={{ borderBottom: '1px dashed', cursor: 'pointer', display: 'inline-block', marginLeft: '1rem' }}
            onClick={() => toggleRuleDetails(key)}
          >
            {showRuleDetails[key] ? 'Hide Rule' : 'Show Rule'}
          </small>
        </div>
        {showRuleDetails[key] && <pre style={{ display: 'block', maxWidth: '500px' }}>{JSON.stringify(rule, null, 2)}</pre>}
      </>
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
      {displayResult('type de production ECS', false)}
      {displayResult('Part de la surface à climatiser', false)}
      <h2 className="fr-mt-2w fr-mb-0">Autre</h2>
    </div>
  );
};

export default SimulatorResults;
