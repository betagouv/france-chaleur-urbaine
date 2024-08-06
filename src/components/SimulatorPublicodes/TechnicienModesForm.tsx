import React from 'react';

import { type SimulatorEngine } from './useSimulatorEngine';

type TechnicienModesFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const TechnicienModesForm: React.FC<TechnicienModesFormProps> = ({ children, className, engine, ...props }) => {
  return (
    <div {...props}>
      <br />
      <br />
      <br />
      <br />
      <br />
      TechnicienModesForm
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

export default TechnicienModesForm;
