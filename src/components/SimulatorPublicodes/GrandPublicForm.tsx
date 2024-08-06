import React from 'react';

import AddressAutocomplete from '@components/form/dsfr/AddressAutocompleteInput';

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
          console.log(''); //eslint-disable-line
          console.log('╔════START══address══════════════════════════════════════════════════'); //eslint-disable-line
          console.log(address); //eslint-disable-line
          console.log('╚════END════address══════════════════════════════════════════════════'); //eslint-disable-line

          engine.setField(
            'département',
            address.properties.context
              .split(', ')[1]
              .toUpperCase()
              // remove accents
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
          );
        }}
      />
      <br />
      <br />
      <br />
      <br />
      <br />
      GrandPublicForm
      <br />
      <br />
      <br />
      <br />
      <br />
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
