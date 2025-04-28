import { type DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { fr } from '@codegouvfr/react-dsfr';
import { motion } from 'framer-motion';
import React from 'react';

import ConfigurationDropdown from '@/components/ComparateurPublicodes/ConfigurationDropdown';
import { addresseToPublicodesRulesKeys } from '@/components/ComparateurPublicodes/mappings';
import { type SimulatorEngine } from '@/components/ComparateurPublicodes/useSimulatorEngine';
import labels from '@/components/form/publicodes/labels';
import Button from '@/components/ui/Button';
import { pick } from '@/utils/core';
import cx from '@/utils/cx';
import { upperCaseFirstChar } from '@/utils/strings';
import { hasProperty } from '@/utils/typescript';

interface ConfigurationProps {
  engine: SimulatorEngine;
  address?: string;
}

const chainedConfigurations = {
  'type de production de froid': ['Inclure la climatisation'],
  'type de production ECS': ['Production eau chaude sanitaire'],
};

const Configuration: React.FC<ConfigurationProps> = ({ engine, address }) => {
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
    engine.resetField(key);
    if (hasProperty(chainedConfigurations, key)) {
      chainedConfigurations[key].forEach((chainedKey) => {
        engine.resetField(chainedKey as DottedName);
      });
    }
  };

  if (!engine.loaded) {
    return null;
  }

  const customSituation = Object.entries(situation).reduce((acc, [key, value]) => {
    if (engine.isDefaultValue(key as DottedName, value)) {
      return acc;
    }

    return { ...acc, [key]: value };
  }, {});

  const toBeDisplayedSituation = Object.entries(customSituation).reduce((acc, [key, situationValue]) => {
    const label = labels[key];
    const value = situationValue;

    if (!label || addresseToPublicodesRulesKeys.includes(key as DottedName)) {
      return acc;
    }

    return { ...acc, [key]: value };
  }, {});

  const hasToBeDisplayedSituation = Object.keys(toBeDisplayedSituation).length > 0;

  return (
    <div className={cx(fr.cx('fr-container'), 'sticky top-0 bg-white z-10 py-2 shadow-sm')}>
      <div className="flex items-center justify-between">
        <h4 className="!mb-0">Configuration</h4>
        <ConfigurationDropdown
          configuration={{ address, ...toBeDisplayedSituation }}
          onLoadConfiguration={({ address, ...newSituation }) => {
            engine.setSituation({ ...pick(situation, addresseToPublicodesRulesKeys), ...newSituation });
          }}
          loadWhenOnlyOneConfig={
            !!address && Object.keys(customSituation).some((key) => addresseToPublicodesRulesKeys.includes(key as DottedName))
          }
        />
      </div>
      {hasToBeDisplayedSituation && (
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(toBeDisplayedSituation).map(([key, value]) => {
            const label = labels[key];
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
                  <span className="text-faded">{upperCaseFirstChar(label || '')}</span>:{' '}
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
        </div>
      )}
    </div>
  );
};

export default Configuration;
