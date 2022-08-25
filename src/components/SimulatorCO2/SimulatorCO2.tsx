import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import React, { useCallback, useMemo, useState } from 'react';
import {
  dataEnergy,
  getConso,
  getEconomy,
  getEmissionCO2,
  getPercentGasReduct,
  TypeEnergy,
} from './SimulatorCO2.businessRule';
import { dataSimulator } from './SimulatorCO2.data';
import {
  Container,
  ContainerBody,
  Input,
  Select,
  SimulatorFooter,
  SimulatorForm,
  SimulatorFormResult,
  SimulatorFormWrapper,
  SimulatorHeader,
  SimulatorWrapper,
} from './SimulatorCO2.style';

const numberToString = (num: number, precision = 0) =>
  `${parseFloat(num.toFixed(precision))}`.replace('.', ',');

const SimulatorCO2: React.FC<{
  children?: React.ReactNode;
  typeSurf: any;
}> = ({ children, typeSurf }) => {
  const [conso, setConso] = useState(0);
  const [surf, setSurf] = useState(0);
  const [log, setLog] = useState(0);
  const [energy, setEnergy] = useState();

  const computedConso = useMemo(
    () => getConso(conso, log, surf, typeSurf),
    [conso, log, surf, typeSurf]
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

  const selectHandleChange = useCallback(
    (e: any) => setEnergy(e.target.value),
    []
  );

  return (
    <Container>
      <SimulatorWrapper>
        <SimulatorHeader>{dataSimulator?.[typeSurf]?.chapo}</SimulatorHeader>
        <SimulatorFormWrapper>
          <SimulatorForm>
            {dataSimulator?.[typeSurf]?.label?.conso && (
              <fieldset>
                <Input
                  type="number"
                  placeholder={dataSimulator?.[typeSurf]?.label?.conso}
                  onChange={(e) => setConso(parseFloat(e.target.value))}
                />
              </fieldset>
            )}
            {dataSimulator?.[typeSurf]?.label?.surf && (
              <fieldset>
                ou{' '}
                <Input
                  type="number"
                  placeholder={dataSimulator?.[typeSurf]?.label?.surf}
                  onChange={(e) => setSurf(parseFloat(e.target.value))}
                />
              </fieldset>
            )}
            {dataSimulator?.[typeSurf]?.label?.log && (
              <fieldset>
                ou{' '}
                <Input
                  type="number"
                  placeholder={dataSimulator?.[typeSurf]?.label?.log}
                  onChange={(e) => setLog(parseInt(e.target.value))}
                />
              </fieldset>
            )}
            {dataSimulator?.[typeSurf]?.label?.chauffage && (
              <fieldset>
                <Select
                  title="energy"
                  name="energy"
                  onChange={selectHandleChange}
                  defaultValue={energy}
                >
                  <option value="">
                    {dataSimulator?.[typeSurf]?.label?.chauffage}
                  </option>
                  {Object.entries(dataEnergy)
                    .filter(([key]) => key !== 'rdc')
                    .map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                </Select>
              </fieldset>
            )}
          </SimulatorForm>

          <SimulatorFormResult inline={dataSimulator?.[typeSurf]?.styleInline}>
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
              theme="grey"
              className="cartridge simulator-result-reduction"
            >
              <strong>{Math.round(percentGasReduct * -1)}%</strong> de réduction
              des émissions de gaz à effet de serre
            </Cartridge>
          </SimulatorFormResult>
        </SimulatorFormWrapper>
        <SimulatorFooter>
          {dataSimulator?.[typeSurf]?.annotation?.map(
            (note: string, i: number) => (
              <div key={i}>{note}</div>
            )
          )}
        </SimulatorFooter>
      </SimulatorWrapper>
      {children && <ContainerBody>{children}</ContainerBody>}
    </Container>
  );
};

export default SimulatorCO2;
