import React from 'react';

import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';
import Select from '@components/form/publicodes/Select';

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
        label="Surface moyenne d'un appartement"
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
            help="Utilisé pour le calcul des coûts par logement et émissions par logement. Par simplification, tous les logements d'un même immeuble sont considérés identiques."
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 5,
              min: 1,
              type: 'number',
            }}
          />
        </>
      )}
    </div>
  );
};

export default ParametresDuBatimentGrandPublicForm;
