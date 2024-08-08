import Accordion from '@codegouvfr/react-dsfr/Accordion';
import React from 'react';

import Input from '@components/form/publicodes/Input';

import { type SimulatorEngine } from './useSimulatorEngine';
type TechnicienBatimentFormProps = React.HTMLAttributes<HTMLDivElement> & {
  engine: SimulatorEngine;
};

const TechnicienBatimentForm: React.FC<TechnicienBatimentFormProps> = ({ children, className, engine, ...props }) => {
  return (
    <div {...props}>
      <Accordion label="TODO">
        {false && (
          <Input name="degré jours unifié spécifique chaud" label="degré jours unifié spécifique chaud" iconId="fr-icon-temp-cold-fill" />
        )}
      </Accordion>
    </div>
  );
};

export default TechnicienBatimentForm;
