import Box from '@components/ui/Box';
import React from 'react';
import SimulatorForm from './SimulatorForm';
import SimulatorResults from './SimulatorResults';
import { type SimulatorSchemaType } from './validation';

type SimulatorProps = React.HTMLAttributes<HTMLDivElement> & {
  // TODO
};

const Simulator: React.FC<SimulatorProps> = ({
  children,
  className,
  ...props
}) => {
  const [results, setResults] = React.useState<SimulatorSchemaType>();

  return (
    <div className={className} {...props}>
      <Box display="flex" gap="4w" justifyContent="space-between">
        <SimulatorForm onSubmit={(data) => setResults(data)} />
        <SimulatorResults results={results} />
      </Box>
    </div>
  );
};

export default Simulator;
