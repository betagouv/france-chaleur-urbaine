import rules, { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import Engine from 'publicodes';
import { useMemo, useState } from 'react';

import Input from '@components/form/Input';
import SimplePage from '@components/shared/page/SimplePage';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';

function SimulateurPage() {
  const [, updateState] = useState({});

  const engine = useMemo(() => new Engine(rules), []);

  const updateSituation = (key: DottedName, value: any) => {
    engine.setSituation({
      ...engine.getSituation(),
      [key]: value === '' ? null : value,
    });
    updateState({});
  };

  const getValueAsString = (key: DottedName) => {
    const result = engine.evaluate(key).nodeValue;

    if (result === null || result === undefined) {
      console.warn(`${key} cannot be evaluated`);
      return '';
    }
    return `${result}`;
  };

  // debug
  if (global.window) {
    (global.window as any).engine = engine;
  }
  console.log('situation', engine.getSituation());

  return (
    <SimplePage title="Simulateur : France Chaleur Urbaine">
      <Box py="4w" className="fr-container">
        <Heading as="h1" color="blue-france">
          Simulateur
        </Heading>

        <Input
          label="Quelle est votre taille (en cm) ?"
          nativeInputProps={{
            placeholder: `${getValueAsString('taille') ?? ''}`,
            onChange: (e) => updateSituation('taille', e.target.value),
          }}
        />
        <Input
          label="Quel est votre poids (en kg) ?"
          nativeInputProps={{
            placeholder: `${getValueAsString('poids') ?? ''}`,
            onChange: (e) => updateSituation('poids', e.target.value),
          }}
        />
        <Box>IMC = {getValueAsString('résultat')}</Box>
        <Box>Interprêtation = {getValueAsString('résultat . interpretation')}</Box>
      </Box>
    </SimplePage>
  );
}

export default SimulateurPage;
