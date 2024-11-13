import React from 'react';

import Checkbox from '@components/form/dsfr/Checkbox';
import Icon from '@components/ui/Icon';
import Text from '@components/ui/Text';
import useArrayQueryState from '@hooks/useArrayQueryState';
import { LocationInfoResponse } from '@pages/api/location-infos';

import { Separator, Title } from './ComparateurPublicodes.style';
import { ModeDeChauffage, modesDeChauffage } from './modes-de-chauffage';
import { Disclaimer, modalDisclaimer } from './Placeholder';
import SelectClimatisation from './SelectClimatisation';
import SelectProductionECS from './SelectProductionECS';
import { type SimulatorEngine } from './useSimulatorEngine';

type ModesDeChauffageAComparerFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
  nearestReseauDeChaleur?: LocationInfoResponse['nearestReseauDeChaleur'];
  nearestReseauDeFroid?: LocationInfoResponse['nearestReseauDeFroid'];
  advancedMode?: boolean;
};
const ModesDeChauffageAComparerForm: React.FC<ModesDeChauffageAComparerFormProps> = ({
  children,
  className,
  engine,
  nearestReseauDeFroid,
  nearestReseauDeChaleur,
  advancedMode,
  ...props
}) => {
  const inclusClimatisation = engine.getField('Inclure la climatisation');
  const typeDeBatiment = engine.getField('type de bâtiment');
  const { has: hasModeDeChauffage, toggle: toggleModeDeChauffage } = useArrayQueryState<ModeDeChauffage>('modes-de-chauffage');
  const createOptionProps = (label: ModeDeChauffage) => ({
    label:
      modesDeChauffage.find((mode) => mode.label === label)?.reversible && inclusClimatisation ? `${label} (chauffage + froid)` : label,
    nativeInputProps: {
      checked: hasModeDeChauffage(label),
      onChange: () => toggleModeDeChauffage(label),
    },
  });

  return (
    <div {...props}>
      <Disclaimer />
      <p className="fr-text--sm">Sélectionnez les modes de chauffage et de refroidissement que vous souhaitez comparer.</p>
      <Text size="xs" color="warning">
        <Icon name="fr-icon-info-line" size="xs" /> Tous les modes de chauffage et de refroidissement ne sont pas interchangeables.{' '}
        <a href="#" onClick={() => modalDisclaimer.open()} className="fr-link fr-text--xs">
          En savoir plus
        </a>
      </Text>
      {
        // in advanced mode, fields are shown at the previous step to be able to fine tune its info
        !advancedMode && (
          <>
            <Title>Eau Chaude Sanitaire</Title>
            <SelectProductionECS />
            <Title>Climatisation</Title>
            <SelectClimatisation />
          </>
        )
      }
      {/* This is because the Text component has a weird 0 bottom border */}
      <div className="fr-mt-4w" />
      <Checkbox
        small
        options={(['Réseau de chaleur'] satisfies ModeDeChauffage[]).map(createOptionProps)}
        state={nearestReseauDeChaleur ? 'success' : 'default'}
        stateRelatedMessage={
          nearestReseauDeChaleur ? (
            <span>
              Disponible à <strong>{nearestReseauDeChaleur.distance}</strong>m du bâtiment
            </span>
          ) : undefined
        }
      />
      <Separator />
      <Checkbox
        small
        options={(['Poêle à granulés individuel', 'Chaudière à granulés collective'] satisfies ModeDeChauffage[])
          .filter((modeDeChauffage) => (typeDeBatiment === 'résidentiel' ? true : modeDeChauffage.includes('collective')))
          .map(createOptionProps)}
      />
      <Separator />
      <Checkbox
        small
        options={(
          [
            'Gaz à condensation individuel',
            'Gaz sans condensation individuel',
            'Gaz à condensation collectif',
            'Gaz sans condensation collectif',
          ] satisfies ModeDeChauffage[]
        )
          .filter((modeDeChauffage) => (typeDeBatiment === 'résidentiel' ? true : modeDeChauffage.includes('collectif')))
          .map(createOptionProps)}
      />
      <Separator />
      <Checkbox
        small
        options={(['Fioul individuel', 'Fioul collectif'] satisfies ModeDeChauffage[])
          .filter((modeDeChauffage) => (typeDeBatiment === 'résidentiel' ? true : modeDeChauffage.includes('collective')))
          .map(createOptionProps)}
      />
      <Separator />
      <Checkbox
        small
        options={(
          [
            'PAC air/air individuelle',
            'PAC air/air collective',
            'PAC eau/eau individuelle',
            'PAC eau/eau collective',
            'PAC air/eau individuelle',
            'PAC air/eau collective',
          ] satisfies ModeDeChauffage[]
        )
          .filter((modeDeChauffage) => (typeDeBatiment === 'résidentiel' ? true : modeDeChauffage.includes('collective')))
          .map(createOptionProps)}
      />
      <Separator />
      <Checkbox small options={(['Radiateur électrique individuel'] satisfies ModeDeChauffage[]).map(createOptionProps)} />
    </div>
  );
};

export default ModesDeChauffageAComparerForm;
