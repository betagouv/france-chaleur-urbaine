import React from 'react';

import Checkbox from '@components/form/dsfr/Checkbox';
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
};

const ModesDeChauffageAComparerForm: React.FC<ModesDeChauffageAComparerFormProps> = ({
  children,
  className,
  engine,
  nearestReseauDeFroid,
  nearestReseauDeChaleur,
  ...props
}) => {
  const inclusClimatisation = engine.getField('Inclure la climatisation');
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
      <p className="fr-text--sm">
        Sélectionnez les modes de chauffage et de refroidissement que vous souhaitez comparer, en notant que{' '}
        <a href="#" onClick={() => modalDisclaimer.open()} className="fr-link fr-text--sm">
          tous les modes de chauffage ne sont pas valables pour toutes les situations
        </a>
      </p>

      <Title>Eau Chaude Sanitaire</Title>
      <SelectProductionECS />
      <Title>Climatisation</Title>
      <SelectClimatisation />
      <Title>Modes de chauffage et de refroidissement</Title>

      <Checkbox
        small
        options={(['Réseaux de chaleur'] satisfies ModeDeChauffage[]).map(createOptionProps)}
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
        options={(['Poêle à granulés individuel', 'Chaudière à granulés collective'] satisfies ModeDeChauffage[]).map(createOptionProps)}
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
        ).map(createOptionProps)}
      />
      <Separator />
      <Checkbox small options={(['Fioul individuel', 'Fioul collectif'] satisfies ModeDeChauffage[]).map(createOptionProps)} />
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
        ).map(createOptionProps)}
      />
      <Separator />
      <Checkbox small options={(['Radiateur électrique individuel'] satisfies ModeDeChauffage[]).map(createOptionProps)} />
    </div>
  );
};

export default ModesDeChauffageAComparerForm;
