import Checkbox from '@codegouvfr/react-dsfr/Checkbox';
import React from 'react';

import Select from '@components/form/publicodes/Select';
import useArrayQueryState from '@hooks/useArrayQueryState';
import { LocationInfoResponse } from '@pages/api/location-infos';

import { ModeDeChauffage } from './modes-de-chauffage';
import { Separator, Title } from './SimulatorPublicodes.style';
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
  const { has: hasModeDeChauffage, toggle: toggleModeDeChauffage } = useArrayQueryState<ModeDeChauffage>('modes-de-chauffage');

  const createOptionProps = (label: ModeDeChauffage) => ({
    label,
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
        options={(['Réseaux de chaleur'] as ModeDeChauffage[]).map(createOptionProps)}
        state={nearestReseauDeChaleur ? 'info' : 'default'}
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
        options={(['Poêle à granulés individuel', 'Chaudière à granulés collective'] as ModeDeChauffage[]).map(createOptionProps)}
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
          ] as ModeDeChauffage[]
        ).map(createOptionProps)}
      />
      <Separator />
      <Checkbox small options={(['Fioul individuel', 'Fioul collectif'] as ModeDeChauffage[]).map(createOptionProps)} />
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
          ] as ModeDeChauffage[]
        ).map(createOptionProps)}
      />
      <Separator />
      <Checkbox small options={(['Radiateur électrique individuel'] as ModeDeChauffage[]).map(createOptionProps)} />
      <Separator />
      <Checkbox
        small
        options={(['Réseaux de froid'] as ModeDeChauffage[]).map(createOptionProps)}
        state={nearestReseauDeFroid ? 'info' : 'default'}
        stateRelatedMessage={
          nearestReseauDeFroid ? (
            <span>
              Disponible à <strong>{nearestReseauDeFroid.distance}</strong>m du bâtiment
            </span>
          ) : undefined
        }
      />
    </div>
  );
};

export default ModesDeChauffageAComparerForm;
