import { type DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { fr } from '@codegouvfr/react-dsfr';
import { motion } from 'framer-motion';
import React from 'react';

import { type SimulatorEngine } from '@/components/ComparateurPublicodes/useSimulatorEngine';
import labels from '@/components/form/publicodes/labels';
import Button from '@/components/ui/Button';
import { upperCaseFirstChar } from '@/utils/strings';

interface SituationConfigurationProps {
  engine: SimulatorEngine;
}

const chainedConfigurations = {
  'type de production de froid': ['Inclure la climatisation'],
  'type de production ECS': ['Production eau chaude sanitaire'],
};

const SituationConfiguration: React.FC<SituationConfigurationProps> = ({ engine }) => {
  const situation = engine.getSituation();

  const formatValue = (key: DottedName, value: any): React.ReactNode => {
    const unit = engine.getUnit(key);

    return (
      <>
        <strong>{value}</strong>
        {unit ? (
          <>
            {' '}
            <span className="text-faded">{unit}</span>
          </>
        ) : null}
      </>
    );
  };

  const deleteSituationConfig = (key: DottedName) => {
    engine.resetField(key as DottedName);
    if (chainedConfigurations[key as keyof typeof chainedConfigurations]) {
      chainedConfigurations[key as keyof typeof chainedConfigurations].forEach((chainedKey) => {
        engine.resetField(chainedKey as DottedName);
      });
    }
  };

  if (!engine.loaded) {
    return null;
  }

  return (
    <div className={fr.cx('fr-container')}>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
        <div className={fr.cx('fr-col-12')}>
          <h4>Paramètres actuels</h4>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(situation).map(([key, situationValue]) => {
              const label = labels[key];
              const value = typeof situationValue === 'string' ? situationValue.replace(/^'|'$/g, '') : situationValue;

              if (
                !label ||
                (engine.isDefaultValue(key as DottedName, value) && value !== 'Groupe froid') // custom because it is by default even if Inclure la climatisation is false
              ) {
                return null;
              }
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 rounded-md bg-gray-100 pl-2 text-xs hover:bg-gray-200"
                >
                  <span>
                    <span className="text-faded">{upperCaseFirstChar(label)}</span>:{' '}
                    <strong className="text-bold">{formatValue(key as DottedName, value)}</strong>
                  </span>
                  <Button
                    iconId="fr-icon-close-line"
                    variant="destructive"
                    priority="tertiary"
                    size="small"
                    title={`Supprimer ${key}`}
                    onClick={() => deleteSituationConfig(key as DottedName)}
                    className="!min-h-2"
                  />
                </motion.div>
              );
            })}
            {Object.keys(situation).length === 0 && <p className="text-gray-500 italic">Aucun paramètre défini</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SituationConfiguration;
