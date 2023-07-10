import { Container, Separator } from './ClassedNetwork.styles';

const ClassedNetwork = () => {
  return (
    <Container>
      <img src="/icons/classed-network.svg" alt="" width={60} height={60} />
      <div>
        <b>
          RESEAU
          <br />
          CLASSÉ
        </b>
      </div>
      <Separator />
      <div>
        Une obligation de raccordement s'applique
        <br />
        pour certains bâtiments (En savoir plus)
      </div>
    </Container>
  );
};

export default ClassedNetwork;
