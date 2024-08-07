import React from 'react';

import AddressAutocomplete from '@components/form/dsfr/AddressAutocompleteInput';
import Input from '@components/form/publicodes/Input';
import RadioInput from '@components/form/publicodes/Radio';

import { type SimulatorEngine } from './useSimulatorEngine';

type GrandPublicFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const GrandPublicForm: React.FC<GrandPublicFormProps> = ({ children, className, engine, ...props }) => {
  return (
    <div {...props}>
      <AddressAutocomplete
        label="Adresse"
        onSelect={(address) => {
          // TODO engine.setField('commune', address.properties.postcode);

          engine.setStringField('code département', address.properties.context.split(', ')[0]);
        }}
      />
      <RadioInput name="type de bâtiment" small orientation="horizontal" />
      <Input name="degré jours unifié spécifique chaud" label="degré jours unifié spécifique chaud" iconId="fr-icon-temp-cold-fill" />
      <Input name="degré jours unifié spécifique froid" label="degré jours unifié spécifique froid" iconId="fr-icon-temp-cold-fill" />
      <Input name="température de référence chaud" label="température de référence chaud" iconId="fr-icon-temp-cold-fill" />
      <Input name="augmenter la température de chauffe" label="augmenter la température de chauffe" iconId="fr-icon-temp-cold-fill" />
      {/* <Input
        name="taille"
        label="Quelle est votre taille (en cm) ?"
        nativeInputProps={{
          placeholder: `${engine.getField('taille') ?? ''}`,
        }}
      />
      <Input
        name="poids"
        label="Quel est votre poids (en kg) ?"
        nativeInputProps={{
          placeholder: `${engine.getField('poids') ?? ''}`,
        }}
      />
      <div>IMC = {engine.getField('résultat')}</div>
      <div>Interprêtation = {engine.getField('résultat . interpretation')}</div> */}
    </div>
  );
};

export default GrandPublicForm;
