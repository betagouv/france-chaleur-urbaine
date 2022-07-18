import {
  Circle,
  Container,
  Equal,
  Label,
  Separator,
  Value,
} from './Band.style';

const Band = () => {
  return (
    <Container>
      <Circle color="#fff" bgColor="#4550e5">
        <Value>1</Value>
        <Label>logement de 70m2</Label>
      </Circle>
      <Equal>=</Equal>
      <Circle>
        <Value>2</Value>tonnes CO2 si chauffé au gaz
      </Circle>
      <Separator>ou</Separator>
      <Circle>
        <Value>2,8</Value>tonnes CO2 si chauffé au fioul
      </Circle>
      <Separator>ou</Separator>
      <Circle color="#fff" bgColor="#069368">
        <Value>1</Value>tonne CO2 si raccordé aux réseaux de chaleur
      </Circle>
    </Container>
  );
};

export default Band;
