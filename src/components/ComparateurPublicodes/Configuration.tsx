import { type DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { fr } from '@codegouvfr/react-dsfr';
import { motion } from 'framer-motion';
import React from 'react';

import { addresseToPublicodesRulesKeys } from '@/components/ComparateurPublicodes/mappings';
import { type SimulatorEngine } from '@/components/ComparateurPublicodes/useSimulatorEngine';
import labels from '@/components/form/publicodes/labels';
import Button from '@/components/ui/Button';
import CrudDropdown from '@/components/ui/CrudDropdown';
import { type ProComparateurConfigurationResponse } from '@/pages/api/pro/comparateur/configurations/[[...slug]]';
import { trackEvent } from '@/services/analytics';
import { notify } from '@/services/notification';
import { pick } from '@/utils/core';
import cx from '@/utils/cx';
import { sortKeys } from '@/utils/objects';
import { upperCaseFirstChar } from '@/utils/strings';
import { hasProperty } from '@/utils/typescript';

interface ConfigurationProps {
  engine: SimulatorEngine;
}

const chainedConfigurations = {
  'type de production de froid': ['Inclure la climatisation'],
  'type de production ECS': ['Production eau chaude sanitaire'],
};

const Configuration: React.FC<ConfigurationProps> = ({ engine }) => {
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
        <CrudDropdown<ProComparateurConfigurationResponse>
          url="/api/pro/comparateur/configurations"
          data={Object.keys(toBeDisplayedSituation).length > 0 ? { situation: toBeDisplayedSituation } : ({} as any)}
          valueKey="id"
          nameKey="name"
          loadLabel="Charger une configuration"
          saveLabel="Sauvegarder la configuration"
          addLabel="Ajouter une configuration"
          addPlaceholderLabel="Nom de la configuration"
          isSameObject={(obj1, obj2) =>
            !!(obj1.situation && obj2.situation && JSON.stringify(sortKeys(obj1.situation)) === JSON.stringify(sortKeys(obj2.situation)))
          }
          onSelect={({ situation: newSituation, id }) => {
            const situationToLoad = { ...pick(situation, addresseToPublicodesRulesKeys), ...newSituation };
            Object.entries(chainedConfigurations).forEach(([configKey, chainedKeys]) => {
              if (configKey in situationToLoad) {
                chainedKeys.forEach((chainedKey) => {
                  situationToLoad[chainedKey as DottedName] = 'oui';
                });
              }
            });

            trackEvent('Comparateur Coûts CO2|Création d’une configuration', {
              configId: id,
            });
            engine.setSituation(situationToLoad);
          }}
          onAdd={({ id }) => {
            trackEvent('Comparateur Coûts CO2|Création d’une configuration', {
              configId: id,
            });
          }}
          onShare={({ id }, { setSharingId }) => {
            const urlToShare = `${window.location.origin}${window.location.pathname}?configId=${id}`;
            navigator.clipboard.writeText(urlToShare);

            const title = 'Ma configuration du comparateur de coûts et CO₂ de France Chaleur Urbaine';
            const text =
              'Voici un lien vers une configuration personnalisée pour comparer les coûts et les émissions de CO₂ de différents modes de chauffage et de refroidissement. Un compte sur France Chaleur Urbaine est nécessaire pour y accéder.\n\n';

            setTimeout(() => {
              trackEvent('Comparateur Coûts CO2|Partage d’une configuration', { configId: id });
              setSharingId(null);
              notify('success', 'Lien copié dans le presse-papiers. Vos contacts devront disposer d’un compte pour l’ouvrir.', {
                duration: 10000,
              });
              window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text)} ${urlToShare}`, '_blank');
            }, 500);
          }}
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
