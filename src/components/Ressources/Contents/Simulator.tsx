import { Select, TextInput } from '@dataesr/react-dsfr';
import { useEffect, useState } from 'react';
import {
  Container,
  Form,
  Inputs,
  Result,
  ResultValue,
  Title,
} from './Simulator.styles';

const Simulator = () => {
  const [structure, setStructure] = useState('Résidentiel');
  const [value, setValue] = useState('');

  useEffect(() => {
    setValue('');
  }, [structure]);

  let help = 0;
  const intValue = parseInt(value, 10);
  if (value) {
    if (structure === 'Résidentiel') {
      help = intValue <= 125 ? 12000 : 77 * intValue + 2300;
    } else {
      help = intValue <= 7500 ? 11000 : 1.07 * intValue + 3000;
    }
  }

  help = help * 0.75 * parseFloat(process.env.PRIX_SPOT_C2E || '6');

  return (
    <Container>
      <Title>
        Estimer le montant du Coup de pouce « Chauffage des bâtiments
        résidentiels collectifs et tertiaires » pour le raccordement de mon
        bâtiment
      </Title>
      <Form>
        <Inputs>
          <Select
            options={[
              { label: 'Résidentiel', value: 'Résidentiel' },
              { label: 'Tertiaire', value: 'Tertiaire' },
            ]}
            selected={structure}
            onChange={(e) => setStructure(e.target.value)}
          />
          <TextInput
            type="number"
            min={1}
            placeholder={
              structure === 'Résidentiel'
                ? 'Nombre de logements'
                : 'Surface (m²)'
            }
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Inputs>
        {value && intValue > 0 && (
          <Result>
            <ResultValue>
              {help.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
              })}
              *
            </ResultValue>
            {structure === 'Résidentiel' && (
              <span>
                Soit{' '}
                {(help / intValue).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                })}
                /logement
              </span>
            )}
          </Result>
        )}
      </Form>
      *Montants donnés à titre indicatif. Contacter un des signataires de la
      charte pour obtenir une offre.
    </Container>
  );
};

export default Simulator;
