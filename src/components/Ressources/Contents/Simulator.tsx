import { Select } from '@codegouvfr/react-dsfr/SelectNext';
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
import Text from '@components/ui/Text';
import { LegacyColor } from '@components/ui/helpers/colors';
import Input from '@codegouvfr/react-dsfr/Input';

const prixSpotCEE = 8.42; // €/MWh cumac

const Simulator = ({
  cartridge,
  withMargin,
  withRedirection,
  children,
  defaultStructure,
  withTitle,
  backgroundColor,
  formBackgroundColor,
  disclaimerLegacyColor,
}: {
  cartridge?: boolean;
  withMargin?: boolean;
  withRedirection?: boolean;
  children?: ReactNode;
  defaultStructure?: string;
  withTitle?: boolean;
  backgroundColor?: string;
  formBackgroundColor?: string;
  disclaimerLegacyColor?: LegacyColor;
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

  help = help * 0.75 * prixSpotCEE;

  return (
    <Container
      withMargin={withMargin}
      cartridge={cartridge}
      withRedirection={withRedirection}
      backgroundColor={backgroundColor}
    >
      {withTitle && (
        <Title>
          Estimer le montant du Coup de pouce « Chauffage des bâtiments
          résidentiels collectifs et tertiaires » pour le raccordement de mon
          bâtiment
        </Title>
      )}
      <Form cartridge={cartridge}>
        <Inputs cartridge={cartridge} backgroundColor={formBackgroundColor}>
          <Select
            label=""
            options={[
              { label: 'Résidentiel', value: 'Résidentiel' },
              { label: 'Tertiaire', value: 'Tertiaire' },
            ]}
            nativeSelectProps={{
              required: true,
              value: structure,
              onChange: (e) => setStructure(e.target.value),
            }}
          />
          <Input
            label=""
            nativeInputProps={{
              type: 'number',
              min: 1,
              placeholder:
                structure === 'Résidentiel'
                  ? 'Nombre de logements'
                  : 'Surface (m²)',
              pattern: '[0-9]*',
              value,
              onChange: (e) => setValue(e.target.value),
            }}
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
                soit{' '}
                {(intValue ? help / intValue : 0).toLocaleString('fr-FR', {
                  style: 'currency',
                  currency: 'EUR',
                  maximumFractionDigits: 0,
                })}{' '}
                d’aide/logement
              </span>
            )}
          </Result>
          <Disclaimer cartridge={cartridge}>
            <Text size="sm" legacyColor={disclaimerLegacyColor || 'black'}>
              *Montants donnés à titre indicatif.
            </Text>
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
