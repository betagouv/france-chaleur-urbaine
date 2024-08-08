import React from 'react';
import { JsonView } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

import Graph from './Graph';
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
    const node = engine.getNode(key);

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
    const unit = engine.getUnit(key);

    return (
      <>
        <div style={{ padding: '0.25rem' }}>
          {calculated ? '🔄' : '✏️'} {key}:
          <strong
            style={{
              border: '1px solid',
              minWidth: '100px',
              margin: '0 0 0 1rem',
              padding: '0 0.5rem',
              display: 'inline-block',
              background: '#EEE',
            }}
          >
            {result as any}
            {unit ? ` ${unit}` : ''}
          </strong>{' '}
          <small style={{ display: 'inline-block', marginLeft: '1rem' }}>{valueType}</small>
          <small
            style={{ borderBottom: '1px dashed', cursor: 'pointer', display: 'inline-block', marginLeft: '1rem' }}
            onClick={() => toggleRuleDetails(key)}
          >
            {showRuleDetails[key] ? 'Hide Rule' : 'Show Rule'}
          </small>
        </div>
        {showRuleDetails[key] && (
          <>
            <pre
              style={{
                display: 'block',
                maxHeight: '500px',
                border: '1px dashed gray',
                padding: '1rem',
                overflow: 'auto',
                fontSize: '10px',
              }}
            >
              Node <JsonView data={node} />
            </pre>
            <pre
              style={{
                display: 'block',
                maxHeight: '500px',
                border: '1px dashed gray',
                padding: '1rem',
                overflow: 'auto',
                fontSize: '10px',
              }}
            >
              Rule
              <JsonView data={rule} />
            </pre>
          </>
        )}
      </>
    );
  };

  return (
    <div className={className} {...props}>
      Ici, on retrouve les résultats
      <Graph engine={engine} />
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
      <h3 className="fr-mt-2w fr-mb-0">Choix du bâtiment</h3>
      {displayResult("nombre de logement dans l'immeuble concerné", false)}
      {displayResult('surface logement type tertiaire', false)}
      {displayResult("Nombre d'habitants moyen par appartement", false)}
      {displayResult('Production eau chaude sanitaire', false)}
      {displayResult('type de production ECS', false)}
      {displayResult('Part de la surface à climatiser', false)}
      {displayResult('Température émetteurs', false)}
      {displayResult('Température émetteurs delta')}
      <h3 className="fr-mt-2w fr-mb-0">Besoins calculés</h3>
      {displayResult('méthode de calcul pour les besoins en chauffage et refroidissement', false)}
      {displayResult('méthode résidentiel', false)}
      {displayResult('méthode tertiaire', false)}
      {displayResult('DPE', false)}
      {displayResult('normes thermiques et âge du bâtiment', false)}
      {displayResult('consommation spécifique chauffage', false)}
      {displayResult('besoins chauffage par appartement', false)}
      {displayResult('consommation spécifique ECS', false)}
      {displayResult('besoins eau chaude sanitaire par appartement', false)}
      {displayResult('consommation spécifique climatisation par habitant', false)}
      {displayResult('besoins en climatisation par appartement', false)}
      <h2 className="fr-mt-2w fr-mb-0">Calcul puissance</h2>
      {displayResult('ratios . PUIS Température de non chauffage', false)}
      {displayResult('ratios . PUIS Facteur de surpuissance', false)}
      {displayResult('ratios . PUIS Nombre heure de fonctionnement non climatique ECS', false)}
      {displayResult('ratios . PUIS Coefficient de foisonnement ECS', false)}
      {displayResult('ratios . PUIS Coefficient de foisonnement chauffage collectif', false)}
      <h2 className="fr-mt-2w fr-mb-0">Réseaux</h2>
      <h3 className="fr-mt-2w fr-mb-0">RFU</h3>
      {displayResult('ratios . RCU Rendement sous station chauffage', false)}
      {displayResult('ratios . RCU Rendement sous station ECS', false)}
      {displayResult('ratios . RCU Conso auxilliaire chauffage', false)}
      {displayResult('ratios . RCU Conso auxilliaire ECS', false)}
      {displayResult('ratios . RCU Durée avant renouvellement', false)}
      <h3 className="fr-mt-2w fr-mb-0">RCU</h3>
      {displayResult('ratios . RFU Rendement sous station', false)}
      {displayResult('ratios . RFU Conso auxiliaire', false)}
      {displayResult('ratios . RFU Durée de vie', false)}
      <h2 className="fr-mt-2w fr-mb-0">Granulés</h2>
      <h3 className="fr-mt-2w fr-mb-0">Poêle à granulés indiv</h3>
      {displayResult('ratios . GRA POELE Rendement poêle chauffage', false)}
      {displayResult('ratios . GRA POELE Conso combustible', false)}
      {displayResult('ratios . GRA POELE Durée de vie', false)}
      <h3 className="fr-mt-2w fr-mb-0">Chaudière à granulés coll</h3>
      {displayResult('ratios . GRA CHAUD Rendement chaudière chauffage', false)}
      {displayResult('ratios . GRA CHAUD Conso combustible', false)}
      {displayResult('ratios . GRA CHAUD Conso auxilliaire', false)}
      {displayResult('ratios . GRA CHAUD Durée de vie', false)}
      <h2 className="fr-mt-2w fr-mb-0">Gaz</h2>
      <h3 className="fr-mt-2w fr-mb-0">Gaz indiv avec cond</h3>
      {displayResult('ratios . GAZ IND COND Rendement chaudière chauffage', false)}
      {displayResult('ratios . GAZ IND COND Rendement chaudière ECS', false)}
      {displayResult('ratios . GAZ IND COND Conso combustible', false)}
      {displayResult('ratios . GAZ IND COND Conso auxilliaire chauffage', false)}
      {displayResult('ratios . GAZ IND COND Conso auxilliaire ECS', false)}
      {displayResult('ratios . GAZ IND COND Durée de vie', false)}
      <h3 className="fr-mt-2w fr-mb-0">Gaz indiv sans cond</h3>
      {displayResult('ratios . GAZ IND SCOND Rendement chaudière', false)}
      {displayResult('ratios . GAZ IND SCOND Conso combustible', false)}
      {displayResult('ratios . GAZ IND SCOND Conso auxilliaire chauffage', false)}
      {displayResult('ratios . GAZ IND SCOND Conso auxilliaire ECS', false)}
      {displayResult('ratios . GAZ IND SCOND Durée de vie', false)}
      <h3 className="fr-mt-2w fr-mb-0">Gaz coll avec cond</h3>
      {displayResult('ratios . GAZ COLL COND Rendement chaudière chauffage', false)}
      {displayResult('ratios . GAZ COLL COND Rendement chaudière ECS', false)}
      {displayResult('ratios . GAZ COLL COND Conso combustible', false)}
      {displayResult('ratios . GAZ COLL COND Conso auxilliaire chauffage', false)}
      {displayResult('ratios . GAZ COLL COND Conso auxilliaire ECS', false)}
      {displayResult('ratios . GAZ COLL COND Durée de vie', false)}
      <h3 className="fr-mt-2w fr-mb-0">Gaz coll sans cond</h3>
      {displayResult('ratios . GAZ COLL SCOND Rendement chaudière', false)}
      {displayResult('ratios . GAZ COLL SCOND Conso combustible', false)}
      {displayResult('ratios . GAZ COLL SCOND Conso auxilliaire chauffage', false)}
      {displayResult('ratios . GAZ COLL SCOND Conso auxilliaire ECS', false)}
      {displayResult('ratios . GAZ COLL SCOND Durée de vie', false)}
      <h2 className="fr-mt-2w fr-mb-0">Fioul</h2>
      <h3 className="fr-mt-2w fr-mb-0">Fioul indiv</h3>
      {displayResult('ratios . FIOUL IND Rendement chaudière', false)}
      {displayResult('ratios . FIOUL IND Conso combustible', false)}
      {displayResult('ratios . FIOUL IND Conso auxilliaire chauffage', false)}
      {displayResult('ratios . FIOUL IND Conso auxilliaire ECS', false)}
      {displayResult('ratios . FIOUL IND Durée de vie', false)}
      <h3 className="fr-mt-2w fr-mb-0">Fioul coll</h3>
      {displayResult('ratios . FIOUL COLL Rendement chaudière chauffage', false)}
      {displayResult('ratios . FIOUL COLL Rendement chaudière ECS', false)}
      {displayResult('ratios . FIOUL COLL Conso combustible', false)}
      {displayResult('ratios . FIOUL COLL Conso auxilliaire chauffage', false)}
      {displayResult('ratios . FIOUL COLL Conso auxilliaire ECS', false)}
      {displayResult('ratios . FIOUL COLL Durée de vie', false)}
      <h2 className="fr-mt-2w fr-mb-0">Pompe à chaleur</h2>
      <h3 className="fr-mt-2w fr-mb-0">PAC air/air réversible</h3>
      {displayResult('ratios . PAC AIR AIR SCOP indiv', false)}
      {displayResult('ratios . PAC AIR AIR SCOP coll', false)}
      {displayResult('ratios . PAC AIR AIR SEER indiv', false)}
      {displayResult('ratios . PAC AIR AIR SEER coll', false)}
      {displayResult('ratios . PAC AIR AIR Durée de vie indiv', false)}
      {displayResult('ratios . PAC AIR AIR Durée de vie coll', false)}
      <h3 className="fr-mt-2w fr-mb-0">PAC eau/eau</h3>
      {displayResult('ratios . PAC EAU EAU SCOP indiv capteurs horizontaux', false)}
      {displayResult('ratios . PAC EAU EAU SCOP coll champ de sondes', false)}
      {displayResult('ratios . PAC EAU EAU Durée de vie', false)}
      {displayResult('ratios . PAC EAU EAU Durée de vie puits géothermiques', false)}
      <h3 className="fr-mt-2w fr-mb-0">PAC air/eau réversible</h3>
      {displayResult('ratios . PAC AIR EAU SCOP indiv', false)}
      {displayResult('ratios . PAC AIR EAU SCOP coll', false)}
      {displayResult('ratios . PAC AIR EAU SEER indiv', false)}
      {displayResult('ratios . PAC AIR EAU SEER coll', false)}
      {displayResult('ratios . PAC AIR EAU Durée de vie indiv', false)}
      {displayResult('ratios . PAC AIR EAU Durée de vie coll', false)}
      <h2 className="fr-mt-2w fr-mb-0">Radiateur électrique indiv</h2>
      {displayResult('ratios . RAD ELEC INDIV Rendement', false)}
      {displayResult('ratios . RAD ELEC INDIV Conso combustible', false)}
      {displayResult('ratios . RAD ELEC INDIV Durée de vie', false)}
      <h2 className="fr-mt-2w fr-mb-0">Calcul ECS</h2>
      <h3 className="fr-mt-2w fr-mb-0">Chauffe-eau éléctrique à accumulation</h3>
      {displayResult('ratios . CHAUF EAU ELEC Rendement stockage ballon', false)}
      {displayResult('ratios . CHAUF EAU ELEC Durée de vie', false)}
      <h3 className="fr-mt-2w fr-mb-0">Chauffe-eau éléctrique à accumulation</h3>
      {displayResult('ratios . CHAUF EAU SOLAIRE Rendement stockage ballon', false)}
      {displayResult('ratios . CHAUF EAU SOLAIRE Durée de vie', false)}
      {displayResult("ratios . CHAUF EAU SOLAIRE Part du solaire dans la production d'ECS", false)}
    </div>
  );
};

export default SimulatorResults;
