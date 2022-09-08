import { Demand } from 'src/types/Summary/Demand';
import { Container } from './AdditionalInformation.styles';

const AdditionalInformation = ({ demand }: { demand: Demand }) => {
  return (
    <Container>
      <div>{demand.Logement && `${demand.Logement} lots`}</div>
      <div>{demand.Conso && `${demand.Conso} MWh`}</div>
    </Container>
  );
};

export default AdditionalInformation;
