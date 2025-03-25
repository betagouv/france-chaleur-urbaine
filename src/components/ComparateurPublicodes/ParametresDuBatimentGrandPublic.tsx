import { useSearchParams } from 'next/navigation';
import React from 'react';

import Input from '@/components/form/publicodes/Input';
import RadioInput from '@/components/form/publicodes/Radio';
import Select from '@/components/form/publicodes/Select';
import Link from '@/components/ui/Link';

import { type SimulatorEngine } from './useSimulatorEngine';

type ParametresDuBatimentGrandPublicFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const ParametresDuBatimentGrandPublicForm: React.FC<ParametresDuBatimentGrandPublicFormProps> = ({
  children,
  className,
  engine,
  ...props
}) => {
  const typeBatiment = engine.getField('type de bâtiment');
  const nbLogements = engine.getFieldAsNumber("nombre de logements dans l'immeuble concerné");

  const searchParams = useSearchParams();
  return (
    <div {...props}>
      <RadioInput name="type de bâtiment" small orientation="horizontal" />
      {typeBatiment === 'résidentiel' && (
        <>
          <Select
            name="méthode résidentiel"
            label="Méthode de calcul pour les besoins en chauffage et refroidissement"
            help="Les normes thermiques permettent une estimation des besoins de chaleur plus précise que les DPE. Elles peuvent être estimées par l'année de construction ou de rénovation du logement."
          />
          {engine.getField('méthode résidentiel') === 'DPE' && <Select name="DPE" label="DPE" />}
          {engine.getField('méthode résidentiel') === 'Normes thermiques et âge du bâtiment' && (
            <Select name="normes thermiques et âge du bâtiment" label="Normes thermiques et âge du bâtiment" />
          )}
        </>
      )}
      {typeBatiment === 'tertiaire' && (
        <>
          <Select name="méthode tertiaire" label="Méthode de calcul pour les besoins en chauffage et refroidissement" />
          <Select name="normes thermiques tertiaire" label="Normes thermiques tertiaire" />
        </>
      )}
      <Input
        name="surface logement type tertiaire"
        label={typeBatiment === 'tertiaire' ? 'Surface moyenne' : "Surface moyenne d'un appartement"}
        nativeInputProps={{
          inputMode: 'numeric',
          maxLength: 6,
          type: 'number',
        }}
      />
      {typeBatiment === 'résidentiel' && (
        <>
          <Input
            name="Nombre d'habitants moyen par appartement"
            label="Nombre d'habitants moyen par appartement"
            help="Le nombre d'habitants permet d'estimer la consommation d'eau chaude sanitaire du logement."
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 2,
              type: 'number',
            }}
          />
          <Input
            name="nombre de logements dans l'immeuble concerné"
            label="Nombre de logements dans l'immeuble concerné"
            help="Par simplification, tous les logements d'un même immeuble sont considérés identiques."
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 5,
              min: 1,
              type: 'number',
            }}
            {...(nbLogements && nbLogements <= 1
              ? {
                  state: 'error',
                  stateRelatedMessage: (
                    <span>
                      Le mode grand public du comparateur est limité aux bâtiments collectifs (copropriétés, logement social...). Pour une
                      maison individuelle, rendez-vous sur le{' '}
                      <Link href={`/pro/comparateur-couts-performances?${searchParams.toString()}`}>mode avancé</Link>.
                    </span>
                  ),
                }
              : {})}
          />
        </>
      )}
    </div>
  );
};

export default ParametresDuBatimentGrandPublicForm;
