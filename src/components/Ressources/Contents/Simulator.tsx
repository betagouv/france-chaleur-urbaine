import { Select, TextInput } from '@dataesr/react-dsfr';
import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import {
  Container,
  Disclaimer,
  Form,
  Inputs,
  RedirectionButton,
  Result,
  ResultValue,
  Title,
} from './Simulator.styles';

const Simulator = ({
  cartridge,
  withMargin,
  withRedirection,
  children,
  defaultStructure,
  withTitle,
}: {
  cartridge?: boolean;
  withMargin?: boolean;
  withRedirection?: boolean;
  children?: ReactNode;
  defaultStructure?: string;
  withTitle?: boolean;
}) => {
  const [structure, setStructure] = useState(defaultStructure || 'Résidentiel');
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
    <Container
      withMargin={withMargin}
      cartridge={cartridge}
      withRedirection={withRedirection}
    >
      {withTitle && (
        <Title>
          Estimer le montant du Coup de pouce « Chauffage des bâtiments
          résidentiels collectifs et tertiaires » pour le raccordement de mon
          bâtiment
        </Title>
      )}
      <Form cartridge={cartridge}>
        <Inputs cartridge={cartridge}>
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
        <div>
          <Result cartridge={cartridge} className="simulator-result">
            <ResultValue>
              {help.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                maximumFractionDigits: 0,
              })}
              *
            </ResultValue>
            {structure === 'Résidentiel' && (
              <span>
                Soit{' '}
                {(intValue ? help / intValue : 0).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                })}
                /logement
              </span>
            )}
          </Result>
          <Disclaimer cartridge={cartridge}>
            *Montants donnés à titre indicatif.
          </Disclaimer>
        </div>
      </Form>
      {withRedirection && (
        <RedirectionButton>
          <Link href="/ressources/aides#contenu">
            Tout savoir sur cette aide
          </Link>
        </RedirectionButton>
      )}
      {children}
    </Container>
  );
};

export default Simulator;
