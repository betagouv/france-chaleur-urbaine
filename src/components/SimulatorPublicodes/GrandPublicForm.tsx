import React from 'react';

import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';
import Select from '@components/form/publicodes/Select';

import { type SimulatorEngine } from './useSimulatorEngine';

type GrandPublicFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const GrandPublicForm: React.FC<GrandPublicFormProps> = ({ children, className, engine, ...props }) => {
  const typeBatiment = engine.getField('type de bâtiment');
  const productionECS = engine.getField('Production eau chaude sanitaire');

  return (
    <div {...props}>
      <RadioInput name="type de bâtiment" small orientation="horizontal" />
      {typeBatiment === 'résidentiel' && (
        <>
          <Select
            name="méthode résidentiel"
            label="méthode de calcul pour les besoins en chauffage et refroidissement"
            hintText="méthode résidentiel"
          />
          {engine.getField('méthode résidentiel') === 'DPE' && <Select name="DPE" label="DPE" />}
          {engine.getField('méthode résidentiel') === 'Normes thermiques et âge du bâtiment' && (
            <Select name="normes thermiques et âge du bâtiment" label="normes thermiques et âge du bâtiment" />
          )}
        </>
      )}
      {typeBatiment === 'tertiaire' && (
        <>
          <Select
            name="méthode tertiaire"
            label="méthode de calcul pour les besoins en chauffage et refroidissement"
            hintText="méthode tertiaire"
          />
          <Select name="normes thermiques tertiaire" label="normes thermiques tertiaire" />
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
            name="nombre de logement dans l'immeuble concerné"
            label="nombre de logement dans l'immeuble concerné"
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 5,
              type: 'number',
            }}
          />
        </>
      )}
      <RadioInput name="Production eau chaude sanitaire" label="Production eau chaude sanitaire" small orientation="horizontal" />
      {productionECS && <Select name="type de production ECS" label="type de production ECS" />}
      <Input
        name="Part de la surface à climatiser"
        label="Part de la surface à climatiser"
        nativeInputProps={{
          inputMode: 'numeric',
          maxLength: 3,
          type: 'number',
          min: 0,
          max: 100,
          step: 1,
        }}
      />
    </div>
  );
};

export default GrandPublicForm;
