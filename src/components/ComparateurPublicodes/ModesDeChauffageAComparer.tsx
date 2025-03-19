import { useSearchParams } from 'next/navigation';
import React from 'react';

import Checkboxes from '@/components/form/dsfr/Checkboxes';
import Heading from '@/components/ui/Heading';
import Link from '@/components/ui/Link';
import Notice from '@/components/ui/Notice';
import useArrayQueryState from '@/hooks/useArrayQueryState';
import { type LocationInfoResponse } from '@/pages/api/location-infos';

import { Title } from './ComparateurPublicodes.style';
import { modesDeChauffage, type ModeDeChauffage } from './mappings';
import { DisclaimerButton } from './Placeholder';
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
  const searchParams = useSearchParams();
  const inclusClimatisation = engine.getField('Inclure la climatisation');
  const typeDeBatiment = engine.getField('type de bâtiment');
  const { has: hasModeDeChauffage, toggle: toggleModeDeChauffage } = useArrayQueryState<ModeDeChauffage>('modes-de-chauffage');

  const modesDeChauffageAComparer = modesDeChauffage.filter((mode) => (advancedMode ? true : mode.grandPublicMode));

  const createOptionProps = (suffix?: string) => (label: ModeDeChauffage) => ({
    label:
      modesDeChauffageAComparer.find((mode) => mode.label === label)?.reversible && inclusClimatisation
        ? `${label}${suffix ? ` ${suffix}` : ''} (chauffage + froid)`
        : `${label}${suffix ? ` ${suffix}` : ''}`,
    nativeInputProps: {
      checked: hasModeDeChauffage(label),
      onChange: () => toggleModeDeChauffage(label),
    },
  });

  return (
    <div {...props}>
      <p className="fr-text--sm">Sélectionnez les modes de chauffage et de refroidissement que vous souhaitez comparer.</p>
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
      <DisclaimerButton className="!mb-5" />
      <Heading as="h3" size="h6">
        Chauffage collectif
      </Heading>
      <Checkboxes
        small
        options={(['Réseau de chaleur'] satisfies ModeDeChauffage[]).map(
          createOptionProps(!advancedMode && !nearestReseauDeChaleur ? '(Non disponible)' : undefined)
        )}
        state={nearestReseauDeChaleur ? 'success' : 'default'}
        className="[&_p]:!mb-0"
        disabled={!advancedMode && !nearestReseauDeChaleur}
        stateRelatedMessage={
          nearestReseauDeChaleur ? (
            <span>
              Disponible à <strong>{nearestReseauDeChaleur.distance}</strong>m du bâtiment
            </span>
          ) : undefined
        }
      />
      <Checkboxes
        small
        options={(
          [
            'Chaudière à granulés collective',
            'Gaz à condensation collectif',
            'Gaz sans condensation collectif',
            'Fioul collectif',
            'PAC air/air collective',
            'PAC eau/eau collective',
            'PAC air/eau collective',
          ] satisfies ModeDeChauffage[]
        )
          .filter((modeLabel) => modesDeChauffageAComparer.some((mode) => mode.label === modeLabel))
          .map(createOptionProps())}
      />
      {typeDeBatiment === 'résidentiel' && (
        <>
          <Heading as="h3" size="h6">
            Chauffage individuel
          </Heading>
          <Checkboxes
            small
            options={(
              [
                'Poêle à granulés individuel',
                'Gaz à condensation individuel',
                'Gaz sans condensation individuel',
                'Fioul individuel',
                'PAC air/air individuelle',
                'PAC eau/eau individuelle',
                'PAC air/eau individuelle',
                'Radiateur électrique individuel',
              ] satisfies ModeDeChauffage[]
            )
              .filter((modeLabel) => modesDeChauffageAComparer.some((mode) => mode.label === modeLabel))
              .map(createOptionProps())}
          />
        </>
      )}
      {!advancedMode && (
        <Notice variant="info" size="xs">
          Comparez d'autres modes de chauffage sur le{' '}
          <Link href={`/pro/comparateur-couts-performances?${searchParams.toString()}`}>mode avancé</Link>, accessible sur connexion
        </Notice>
      )}
    </div>
  );
};

export default ModesDeChauffageAComparerForm;
