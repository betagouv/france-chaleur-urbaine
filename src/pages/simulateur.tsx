import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import { isDefined } from '@utils/core';
import { ObjectEntries } from '@utils/typescript';
import { ChangeEvent } from 'react';
import { typeBool } from 'src/services/simulateur/helper';
import { useSimulatorState } from 'src/services/simulateur/hook';
import { KeyParametre, parametres } from 'src/services/simulateur/parametres';

function SimulateurPage() {
  const { publicState, internalState, updateState } = useSimulatorState();

  function onFormFieldUpdate(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    updateState(
      e.target.name as KeyParametre,
      e.target instanceof HTMLInputElement && e.target.type === 'checkbox'
        ? e.target.checked
        : e.target.value
    );
  }

  return (
    <SimplePage title="Simulateur : France Chaleur Urbaine">
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Simulateur
        </Heading>

        <p>définition paramètres</p>
        <Box display="flex">
          <Box>
            {ObjectEntries(parametres).map(([key, config]) => (
              <Box display="flex" mt="1v" key={key}>
                - {key}
                {config.type === typeBool ? (
                  <input
                    style={{ border: '1px solid', margin: '0 16px' }}
                    name={key}
                    type="checkbox"
                    placeholder={`${internalState[key] ?? ''}`}
                    checked={publicState[key] as unknown as boolean} // FIXME typage state cassé
                    onChange={onFormFieldUpdate}
                  />
                ) : isDefined(config.options) ? (
                  <select
                    style={{ border: '1px solid', margin: '0 16px' }}
                    name={key}
                    value={`${internalState[key] ?? ''}`}
                    onChange={onFormFieldUpdate}
                  >
                    {config.options.map((option, key) => (
                      <option value={option.value} key={key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    style={{ border: '1px solid', margin: '0 16px' }}
                    name={key}
                    placeholder={`${internalState[key] ?? ''}`}
                    value={publicState[key] as string}
                    onChange={onFormFieldUpdate}
                  />
                )}
                {config.unit}
              </Box>
            ))}
          </Box>
          <Box fontSize="small">
            <pre>public state {JSON.stringify(publicState, null, 2)}</pre>
            <pre>internal state {JSON.stringify(internalState, null, 2)}</pre>
          </Box>
        </Box>
      </Box>
    </SimplePage>
  );
}

export default SimulateurPage;
