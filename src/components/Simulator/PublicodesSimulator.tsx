import Box from '@components/ui/Box';
import React from 'react';
import PublicodesSimulatorForm from './PublicodesSimulatorForm';
import PublicodesSimulatorResults from './PublicodesSimulatorResults';
import { type PublicodeSimulatorSchemaType } from './validation';

type PublicodesSimulatorProps = React.HTMLAttributes<HTMLDivElement> & {
  // TODO
};

const PublicodesSimulator: React.FC<PublicodesSimulatorProps> = ({
  children,
  className,
  ...props
}) => {
  const [results, setResults] = React.useState<PublicodeSimulatorSchemaType>();

  return (
    <div className={className} {...props}>
      <Box display="flex" gap="4w" justifyContent="space-between">
        <PublicodesSimulatorForm onSubmit={(data) => setResults(data)} />
        <PublicodesSimulatorResults results={results} />
      </Box>
    </div>
  );
};

export default PublicodesSimulator;
