import { CallOut } from '@codegouvfr/react-dsfr/CallOut';
import React from 'react';
import { SimulatorSchemaType } from './validation';
type SimulatorResultsProps = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'results'
> & {
  results?: SimulatorSchemaType;
};

const SimulatorResults: React.FC<SimulatorResultsProps> = ({
  children,
  className,
  results,
  ...props
}) => {
  return (
    <div className={className} {...props}>
      {!results ? (
        <CallOut title="FOrmulaire incomplet">Remplissez le formulaire</CallOut>
      ) : (
        <pre>{JSON.stringify(results, null, 2)}</pre>
      )}
    </div>
  );
};

export default SimulatorResults;
