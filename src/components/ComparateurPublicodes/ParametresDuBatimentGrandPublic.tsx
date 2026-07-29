import { useSearchParams } from 'next/navigation';
import type React from 'react';

import Input from '@/components/form/publicodes/Input';
import RadioInput from '@/components/form/publicodes/Radio';
import Select from '@/components/form/publicodes/Select';
import Link from '@/components/ui/Link';

import type { SimulatorEngine } from './useSimulatorEngine';

type ParametresDuBatimentGrandPublicFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const ParametresDuBatimentGrandPublicForm: React.FC<ParametresDuBatimentGrandPublicFormProps> = ({
  children,
  className,
  engine,
  ...props
}) => {
  const typeBatiment = engine.getField('bâtiment . type');
  const nbLogements = engine.getFieldAsNumber('bâtiment . nombre de logements');

  const searchParams = useSearchParams();
  return (
    <div {...props}>
      <RadioInput name="bâtiment . type" small orientation="horizontal" />
      {typeBatiment === 'résidentiel' && (
        <>
          <Select
            name="bâtiment . méthode résidentiel"
            label="Méthode de calcul pour les besoins en chauffage et refroidissement"
            help="Les normes thermiques permettent une estimation des besoins de chaleur plus précise que les DPE. Elles peuvent être estimées par l'année de construction ou de rénovation du logement."
          />
          {engine.getField('bâtiment . méthode résidentiel') === 'DPE' && <Select name="bâtiment . DPE" label="DPE" />}
          {engine.getField('bâtiment . méthode résidentiel') === 'Normes thermiques et âge du bâtiment' && (
            <Select name="bâtiment . normes thermiques et âge" label="Normes thermiques et âge du bâtiment" />
          )}
        </>
      )}
      {typeBatiment === 'tertiaire' && (
        <>
          <Select name="bâtiment . méthode tertiaire" label="Méthode de calcul pour les besoins en chauffage et refroidissement" />
          <Select name="bâtiment . normes thermiques tertiaire" label="Normes thermiques tertiaire" />
        </>
      )}
      <Input
        name="bâtiment . surface tertiaire"
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
            name="bâtiment . habitants par logement"
            label="bâtiment . habitants par logement"
            help="Le nombre d'habitants permet d'estimer la consommation d'eau chaude sanitaire du logement."
            nativeInputProps={{
              inputMode: 'numeric',
              maxLength: 2,
              type: 'number',
            }}
          />
          <Input
            name="bâtiment . nombre de logements"
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
                      <Link href={`/pro/comparateur-couts-performances?${searchParams?.toString() ?? ''}`}>mode avancé</Link>.
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
