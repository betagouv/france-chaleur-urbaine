import { Select } from '@codegouvfr/react-dsfr/SelectNext';
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
import { dataSimulator, dataSimulatorTertiaire } from './SimulatorCO2.data';
import {
  BigResult,
  BoxSimulator,
  CartridgeSimulatorFooter,
  CartridgeSimulatorForm,
  Container,
  ContainerBody,
  Input,
  Separator,
  SimulatorFooter,
  SimulatorForm,
  SimulatorHeader,
  SimulatorResult,
  SmallResult,
  SurfSelect,
} from './SimulatorCO2.style';
import Box, { ResponsiveRow } from '@components/ui/Box';
import Text from '@components/ui/Text';

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
  textColor?: string;
}> = ({ typeSurf, children, textColor }) => {
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

  const data =
    typeSurf === TypeSurf.copropriete ? dataSimulator : dataSimulatorTertiaire;
  const form = (
    <>
      <fieldset>
        <Input
          label=""
          nativeInputProps={{
            type: 'number',
            placeholder: data.label.conso,
            onChange: (e) => setConso(parseFloat(e.target.value)),
          }}
        />
      </fieldset>
      <fieldset>
        ou
        <Input
          label=""
          nativeInputProps={{
            type: 'number',
            placeholder: data.label.surf,
            onChange: (e) => setSurf(parseFloat(e.target.value)),
          }}
        />
      </fieldset>
      <fieldset>
        ou
        <Input
          label=""
          nativeInputProps={{
            type: 'number',
            placeholder: data.label.log,
            onChange: (e) => setLog(parseFloat(e.target.value)),
          }}
        />
      </fieldset>
      <fieldset>
        <Select
          label=""
          options={[
            {
              label: data.label.chauffage,
              value: '',
            },
            ...Object.entries(dataEnergy)
              .filter(([key]) => key !== 'rdc')
              .map(([key, { label }]) => ({ label, value: key })),
          ]}
          nativeSelectProps={{
            required: true,
            value: energy,
            onChange: selectHandleChange,
          }}
        />
      </fieldset>
    </>
  );

  const content = (
    <>
      {!typeSurf && (
        <SurfSelect
          label=""
          options={buildingTypeSelectOptions}
          nativeSelectProps={{
            required: true,
            value: simulatorType,
            onChange: (e: any) => setSimulatorType(e.target.value),
          }}
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
            {data.annotation.map((note: string, i: number) => (
              <div key={i}>{note}</div>
            ))}
          </CartridgeSimulatorFooter>
        </>
      ) : (
        <Box
          display="flex"
          position="relative"
          flexDirection="column"
          justifyContent="space-between"
          alignItems="flex-start"
          pb="2w"
        >
          {typeSurf && <SimulatorHeader>{data.chapo}</SimulatorHeader>}
          <ResponsiveRow gap="20px">
            <Box>
              <SimulatorForm>{form}</SimulatorForm>
            </Box>
            <Box display="flex" flexDirection="column" gap="10px">
              <Box
                backgroundColor="#27a658"
                display="flex"
                flexDirection="row"
                py="3w"
                px="2w"
                alignItems="center"
              >
                <Box
                  display="flex"
                  flexDirection="row"
                  gap="5px"
                  alignItems="center"
                >
                  <Text fontSize="50px" fontWeight="bold">
                    {numberToString(economy * -1, 1)}
                  </Text>
                  <Text size="sm">
                    tCO2/an
                    <br />
                    évitées
                  </Text>
                </Box>
                <Box>
                  <Text size="lg" fontWeight="bold" px="2w">
                    =
                  </Text>
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  gap="5px"
                >
                  <Text fontSize="30px" fontWeight="bold">
                    {numberToString((economy * -1) / 5, 1)}
                  </Text>
                  <Text>allers-retours Paris/New-York</Text>
                </Box>
              </Box>

              <Box
                backgroundColor="#27a658"
                display="flex"
                flexDirection="row"
                p="2w"
                gap="10px"
                alignItems="center"
              >
                <Box>
                  <Text fontSize="30px" fontWeight="bold">
                    {Math.round(percentGasReduct * -1)}%
                  </Text>
                </Box>
                <Box>
                  <Text size="sm">
                    de réduction des émissions
                    <br />
                    de gaz à effet de serre
                  </Text>
                </Box>
              </Box>
            </Box>
          </ResponsiveRow>
          <SimulatorFooter>
            {data.annotation.map((note: string, i: number) => (
              <div key={i}>{note}</div>
            ))}
          </SimulatorFooter>
        </Box>
      )}
      {children && <ContainerBody>{children}</ContainerBody>}
    </>
  );

  return typeSurf === TypeSurf.copropriete ? (
    <BoxSimulator theme="white">{content}</BoxSimulator>
  ) : (
    <Box textColor={textColor}>
      <Container custom={!typeSurf}>{content}</Container>
    </Box>
  );
};

export default SimulatorCO2;
