import React from 'react';

import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';
import Select from '@components/form/publicodes/Select';

import SelectClimatisation from './SelectClimatisation';
import SelectProductionECS from './SelectProductionECS';
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

  return (
    <div {...props}>
      <RadioInput name="type de bâtiment" small orientation="horizontal" />
      {typeBatiment === 'résidentiel' && (
        <>
          <Select name="méthode résidentiel" label="Méthode de calcul pour les besoins en chauffage et refroidissement" />
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
        label="Surface"
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
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 2,
              type: 'number',
            }}
          />
          <Input
            name="nombre de logements dans l'immeuble concerné"
            label="Nombre de logements dans l'immeuble concerné"
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 5,
              min: 1,
              type: 'number',
            }}
          />
        </>
      )}
      <SelectProductionECS />
      <SelectClimatisation />
    </div>
  );
};

export default ParametresDuBatimentGrandPublicForm;
