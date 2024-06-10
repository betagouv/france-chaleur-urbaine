import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import { ChangeEvent } from 'react';
import { typeBool } from 'src/services/simulateur/helper';
import { KeyParametre, parametres } from 'src/services/simulateur/parametres';
import { ratiosTechniques } from 'src/services/simulateur/ratios';
import { useSimulatorState } from 'src/services/simulateur/simulateur';

function SimulateurPage() {
  const { publicState, internalState, updateState } = useSimulatorState();

  function onFormFieldUpdate(e: ChangeEvent<HTMLInputElement>) {
    updateState(
      e.target.name as KeyParametre,
      e.target.type === 'checkbox' ? e.target.checked : e.target.value
    );
  }

  return (
    <SimplePage title="Simulateur : France Chaleur Urbaine">
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Simulateur
        </Heading>

        <p>ratios (debug)</p>
        {Object.entries(ratiosTechniques)
          .filter(([, value]) => typeof value !== 'object')
          .map(([key, value]) => (
            <div key={key}>
              - {key} : {String(value)}
            </div>
          ))}

        <p>définition paramètres</p>
        {Object.entries(parametres).map(([key, config]) => (
          <Box mt="1v" key={key}>
            - {key}
            <input
              style={{ border: '1px solid', margin: '0 16px' }}
              name={key}
              type={config.type === typeBool ? 'checkbox' : 'text'}
              placeholder={internalState[key as KeyParametre]}
              value={publicState[key as KeyParametre]}
              checked={publicState[key as KeyParametre]}
              onChange={onFormFieldUpdate}
            />{' '}
            default = {internalState[key as KeyParametre]}
            {'unit' in config ? ` (${config.unit})` : ''} | predecessors:{' '}
            {parametres[key as KeyParametre].predecessors?.join(', ')}
            {'unit' in config ? ` (${config.unit})` : ''} | successors:{' '}
            {parametres[key as KeyParametre].successors?.join(', ')}
          </Box>
        ))}
        {/* <p>paramètres</p>
        {Object.entries(parametres).map(([key, config]) => (
          <div key={key}>
            - {key} : {String(config.default)}
            {'unit' in config ? ` (${config.unit})` : ''}
          </div>
        ))} */}
      </Box>
      <pre>public state: {JSON.stringify(publicState, null, 2)}</pre>
      <pre>internal state: {JSON.stringify(internalState, null, 2)}</pre>
    </SimplePage>
  );
}

export default SimulateurPage;
