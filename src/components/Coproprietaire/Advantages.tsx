import { Advantage } from './Advantages.styles';
import { Title } from './Explanation.styles';
import { Container } from './Informations.styles';

const Advantages = () => {
  return (
    <>
      <Title>
        <h2>
          <b>Le chauffage urbain :</b> la garantie d’un service public, et des énergies locales et renouvelables
        </h2>
      </Title>
      <Container>
        <Advantage className="fr-col-md-12 fr-col-lg-3">
          <img src="/img/copro_advantages_1.svg" />
          <div>
            Réduisez vos factures de chauffage <b>jusqu’à 30%</b>
          </div>
        </Advantage>
        <Advantage className="fr-col-md-12 fr-col-lg-3">
          <img src="/img/copro_advantages_2.svg" />
          <div>
            Bénéficiez de <b>subventions</b> mises en place par l’État et d’une <b>TVA à 5,5%</b>
          </div>
        </Advantage>
        <Advantage className="fr-col-md-12 fr-col-lg-3">
          <img src="/img/copro_advantages_3.svg" />
          <div>
            Gagnez en <b>sécurité</b> en supprimant votre chaudière fioul ou gaz
          </div>
        </Advantage>
        <Advantage className="fr-col-md-12 fr-col-lg-3">
          <img src="/img/copro_advantages_4.svg" />
          <div>
            Diminuez vos émissions de CO2 <b>jusqu’à 50%</b>
          </div>
        </Advantage>
      </Container>
    </>
  );
};

export default Advantages;
