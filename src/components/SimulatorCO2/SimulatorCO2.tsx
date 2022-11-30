import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import { Select } from '@dataesr/react-dsfr';
import React, { useCallback, useMemo, useState } from 'react';
import {
  dataEnergy,
  getConso,
  getEconomy,
  getEmissionCO2,
  getPercentGasReduct,
  TypeEnergy,
  TypeSurf,
} from './SimulatorCO2.businessRule';
import { dataSimulator } from './SimulatorCO2.data';
import {
  Container,
  ContainerBody,
  Input,
  SimulatorFooter,
  SimulatorForm,
  SimulatorFormResult,
  SimulatorFormWrapper,
  SimulatorHeader,
  SimulatorWrapper,
  SurfSelect,
} from './SimulatorCO2.style';

const numberToString = (num: number, precision = 0) =>
  `${parseFloat(num.toFixed(precision))}`.replace('.', ',');

const buildingTypeSelectOptions = [
  { label: 'Type de bâtiment', value: '', disabled: true },
  {
    label: 'Copropriété',
    value: TypeSurf.copropriete,
  },
  {
    label: 'Tertiaire',
    value: TypeSurf.tertiaire,
  },
];

const SimulatorCO2: React.FC<{
  children?: React.ReactNode;
  typeSurf?: TypeSurf;
}> = ({ children, typeSurf }) => {
  const [conso, setConso] = useState(0);
  const [surf, setSurf] = useState(0);
  const [log, setLog] = useState(0);
  const [energy, setEnergy] = useState();
  const [simulatorType, setSimulatorType] = useState(TypeSurf.copropriete);

  const computedConso = useMemo(
    () => getConso(conso, log, surf, typeSurf || simulatorType),
    [conso, log, surf, typeSurf, simulatorType]
  );

  const emissionRdc = useMemo(
    () => getEmissionCO2(computedConso, TypeEnergy.rdc),
    [computedConso]
  );

  const emission = useMemo(
    () => getEmissionCO2(computedConso, energy ? energy : undefined),
    [computedConso, energy]
  );

  const economy = useMemo(
    () => getEconomy(emissionRdc, emission),
    [emission, emissionRdc]
  );

  const percentGasReduct = useMemo(
    () => getPercentGasReduct(TypeEnergy.rdc, energy),
    [energy]
  );

  const data = useMemo(
    () => dataSimulator?.[typeSurf || simulatorType],
    [typeSurf, simulatorType]
  );

  const selectHandleChange = useCallback(
    (e: any) => setEnergy(e.target.value),
    []
  );

  return (
    <Container custom={!typeSurf}>
      {!typeSurf && (
        <SurfSelect
          selected={simulatorType}
          options={buildingTypeSelectOptions}
          onChange={(e) => setSimulatorType(e.target.value)}
        />
      )}
      <SimulatorWrapper withPadding={!!typeSurf}>
        {typeSurf && <SimulatorHeader>{data.chapo}</SimulatorHeader>}
        <SimulatorFormWrapper>
          <SimulatorForm>
            {data.label?.conso && (
              <fieldset>
                <Input
                  type="number"
                  placeholder={data.label?.conso}
                  onChange={(e) => setConso(parseFloat(e.target.value))}
                />
              </fieldset>
            )}
            {data.label?.surf && (
              <fieldset>
                ou
                <Input
                  withMargin
                  type="number"
                  placeholder={data.label?.surf}
                  onChange={(e) => setSurf(parseFloat(e.target.value))}
                />
              </fieldset>
            )}
            {data.label?.log && (
              <fieldset>
                ou
                <Input
                  withMargin
                  type="number"
                  placeholder={data.label?.log}
                  onChange={(e) => setLog(parseInt(e.target.value))}
                />
              </fieldset>
            )}
            {data.label?.chauffage && (
              <fieldset>
                <Select
                  onChange={selectHandleChange}
                  selected={energy}
                  options={[
                    {
                      label: data.label?.chauffage,
                      value: '',
                    },
                  ].concat(
                    Object.entries(dataEnergy)
                      .filter(([key]) => key !== 'rdc')
                      .map(([key, { label }]) => ({ label, value: key }))
                  )}
                />
              </fieldset>
            )}
          </SimulatorForm>

          <SimulatorFormResult inline={typeSurf && data.styleInline}>
            <Cartridge
              theme="yellow"
              className="cartridge simulator-result-economy"
            >
              <div className="simulator-result-economy__result">
                <strong>{numberToString(economy * -1, 1)}</strong> tonnes de CO2
                évitées par an
              </div>
              <div className="simulator-result-economy__tips">
                <strong className="tonne">
                  <em>1</em> tonne CO2
                </strong>
                <strong className="equal"> = </strong>
                <span>190 allers-retours Paris-Bordeaux en train</span>
              </div>
            </Cartridge>

            <Cartridge
              theme={typeSurf ? 'grey' : 'color'}
              className="cartridge simulator-result-reduction"
            >
              <strong>{Math.round(percentGasReduct * -1)}%</strong> de réduction
              des émissions de gaz à effet de serre
            </Cartridge>
          </SimulatorFormResult>
        </SimulatorFormWrapper>
        <SimulatorFooter>
          {data.annotation?.map((note: string, i: number) => (
            <div key={i}>{note}</div>
          ))}
        </SimulatorFooter>
      </SimulatorWrapper>
      {children && <ContainerBody>{children}</ContainerBody>}
    </Container>
  );
};

export default SimulatorCO2;
