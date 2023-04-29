import Simulator from '@components/Ressources/Contents/Simulator';
import WrappedText from '@components/WrappedText/WrappedText';
import Link from 'next/link';
import { Container } from './Explanation.styles';

const Simulators = () => {
  return (
    <Container>
      <div className="fr-col-12 fr-col-lg-6">
        <WrappedText
          body={`
::white-arrow-item[Le coup de pouce **« Chauffage des bâtiments résidentiels collectifs et tertiaires »** permet d’obtenir des aides financières conséquentes pour se raccorder.]
::white-arrow-item[*Le coût du raccordement peut ainsi être réduit à quelques centaines d’euros par logement* (en fonction de la situation du bâtiment et de ses besoins en chaleur).]
::white-arrow-item[Différentes entreprises signataires de la charte « Chauffage des bâtiments résidentiels collectifs et tertiaires » offrent cette prime. **Le montant de la prime peut significativement varier d’une entreprise à l’autre, il est donc important de comparer les offres proposées.**]
        `}
        />
        <div className="fr-btn fr-mt-1w fr-ml-4w">
          <Link href="/ressources/aides#contenu">
            Tout savoir sur cette aide
          </Link>
        </div>
      </div>
      <Simulator cartridge></Simulator>
    </Container>
  );
};

export default Simulators;
