import { Cartridge } from '@components/MarkdownWrapper/MarkdownWrapper.style';
import { Select } from '@dataesr/react-dsfr';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  TypeEnergy,
  TypeSurf,
  dataEnergy,
  getConso,
  getEconomy,
  getEmissionCO2,
  getPercentGasReduct,
} from './SimulatorCO2.businessRule';
import { dataSimulator } from './SimulatorCO2.data';
import {
  BigResult,
  Box,
  CartridgeSimulatorFooter,
  CartridgeSimulatorForm,
  Container,
  ContainerBody,
  Input,
  Separator,
  SimulatorFooter,
  SimulatorForm,
  SimulatorFormResult,
  SimulatorFormWrapper,
  SimulatorHeader,
  SimulatorResult,
  SimulatorWrapper,
  SmallResult,
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
  typeSurf?: TypeSurf;
  children?: ReactNode;
}> = ({ typeSurf, children }) => {
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

  const selectHandleChange = useCallback(
    (e: any) => setEnergy(e.target.value),
    []
  );

  const form = (
    <>
      <fieldset>
        <Input
          type="number"
          placeholder={dataSimulator.label.conso}
          onChange={(e: any) => setConso(parseFloat(e.target.value))}
        />
      </fieldset>
      <fieldset>
        ou
        <Input
          type="number"
          placeholder={dataSimulator.label.surf}
          onChange={(e: any) => setSurf(parseFloat(e.target.value))}
        />
      </fieldset>
      <fieldset>
        ou
        <Input
          type="number"
          placeholder={dataSimulator.label.log}
          onChange={(e: any) => setLog(parseInt(e.target.value))}
        />
      </fieldset>
      <fieldset>
        <Select
          onChange={selectHandleChange}
          selected={energy}
          options={[
            {
              label: dataSimulator.label.chauffage,
              value: '',
            },
          ].concat(
            Object.entries(dataEnergy)
              .filter(([key]) => key !== 'rdc')
              .map(([key, { label }]) => ({ label, value: key }))
          )}
        />
      </fieldset>
    </>
  );

  const content = (
    <>
      {!typeSurf && (
        <SurfSelect
          selected={simulatorType}
          options={buildingTypeSelectOptions}
          onChange={(e: any) => setSimulatorType(e.target.value)}
        />
      )}
      {typeSurf === TypeSurf.copropriete ? (
        <>
          <h4>Moins de gaz à effet de serre !</h4>
          <p>
            Estimez les émissions de CO2 évitées grâce au raccordement de votre
            copropriété à un réseau de chaleur*
          </p>
          <CartridgeSimulatorForm>{form}</CartridgeSimulatorForm>
          <SimulatorResult theme="yellow">
            <BigResult>{numberToString(economy * -1, 1)}</BigResult> tonnes de
            CO2 évitées par an
            <Separator />
            <SmallResult>{Math.round(percentGasReduct * -1)}%</SmallResult> de
            réduction des émissions de gaz à effet de serre
          </SimulatorResult>
          <CartridgeSimulatorFooter>
            1 t de CO2 = 190 allers-retours Paris-Bordeaux en train
            <br />
            <br />
            {dataSimulator.annotation.map((note: string, i: number) => (
              <div key={i}>{note}</div>
            ))}
          </CartridgeSimulatorFooter>
        </>
      ) : (
        <>
          <SimulatorWrapper withPadding={!!typeSurf}>
            {typeSurf && (
              <SimulatorHeader>{dataSimulator.chapo}</SimulatorHeader>
            )}
            <SimulatorFormWrapper>
              <SimulatorForm>{form}</SimulatorForm>
              <SimulatorFormResult inline>
                <Cartridge
                  theme="yellow"
                  className="cartridge simulator-result-economy"
                >
                  <div className="simulator-result-economy__result">
                    <strong>{numberToString(economy * -1, 1)}</strong> tonnes de
                    CO2 évitées par an
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
                  <strong>{Math.round(percentGasReduct * -1)}%</strong> de
                  réduction des émissions de gaz à effet de serre
                </Cartridge>
              </SimulatorFormResult>
            </SimulatorFormWrapper>
            <SimulatorFooter>
              {dataSimulator.annotation.map((note: string, i: number) => (
                <div key={i}>{note}</div>
              ))}
            </SimulatorFooter>
          </SimulatorWrapper>
        </>
      )}
      {children && <ContainerBody>{children}</ContainerBody>}
    </>
  );

  return typeSurf === TypeSurf.copropriete ? (
    <Box theme="white">{content}</Box>
  ) : (
    <Container custom={!typeSurf}>{content}</Container>
  );
};

export default SimulatorCO2;
