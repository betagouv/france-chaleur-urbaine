import {
  BlueCircle,
  Container,
  Equal,
  OrangeCircle,
  Separator,
  Stat,
} from './Band.style';
import { Value } from './Statistics.style';

const Band = () => {
  return (
    <Container>
      <BlueCircle>1 logement de 70m2</BlueCircle>
      <Equal>=</Equal>
      <Stat>
        <Value>2</Value>tonnes co2 si chauffé au gaz
      </Stat>
      <Separator>ou</Separator>
      <Stat>
        <Value>2,8</Value>tonnes co2 si chauffé au fioul
      </Stat>
      <Separator>ou</Separator>
      <OrangeCircle>
        <p>1</p>tonne co2 si raccordé aux réseaux de chaleur
      </OrangeCircle>
    </Container>
  );
};

export default Band;
