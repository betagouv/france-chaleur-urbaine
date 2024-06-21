import { Demand } from 'src/types/Summary/Demand';
import { Container } from './Addresse.styles';
import Tag from './Tag';

const Addresse = ({ demand }: { demand: Demand }) => {
  return (
    <Container>
      {demand.Adresse}
      {demand['en PDP'] === 'Oui' && <Tag text="PDP" />}
    </Container>
  );
};

export default Addresse;
