import React from 'react';

import Checkbox from '@components/form/dsfr/Checkbox';
import Select from '@components/form/publicodes/Select';
import useArrayQueryState from '@hooks/useArrayQueryState';
import { LocationInfoResponse } from '@pages/api/location-infos';

import { Separator, Title } from './ComparateurPublicodes.style';
import { ModeDeChauffage, modesDeChauffage } from './modes-de-chauffage';
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
  const productionECS = engine.getField('Production eau chaude sanitaire');
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
      <p>Selectionnez les modes de chauffage et de refroidissement que vous souhaitez comparer</p>
      {productionECS && (
        <>
          <Title>Eau Chaude Sanitaire</Title>
          {productionECS && <Select name="type de production ECS" label="Type de production ECS" />}
        </>
      )}
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
      {inclusClimatisation && (
        <>
          <Separator />
          <Checkbox
            small
            options={(['Réseaux de froid'] satisfies ModeDeChauffage[]).map(createOptionProps)}
            state={nearestReseauDeFroid ? 'success' : 'default'}
            stateRelatedMessage={
              nearestReseauDeFroid ? (
                <span>
                  Disponible à <strong>{nearestReseauDeFroid.distance}</strong>m du bâtiment
                </span>
              ) : undefined
            }
          />
          <Checkbox small options={(['Groupe froid'] satisfies ModeDeChauffage[]).map(createOptionProps)} />
        </>
      )}
    </div>
  );
};

export default ModesDeChauffageAComparerForm;
