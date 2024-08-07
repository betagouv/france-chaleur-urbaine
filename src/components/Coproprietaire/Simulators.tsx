import Link from 'next/link';

import Simulator from '@components/Ressources/Contents/Simulator';
import { Title } from '@components/Ressources/Contents/Simulator.styles';
import WrappedText from '@components/WrappedText/WrappedText';

import { Container } from './Explanation.styles';

const Simulators = ({ textTitle, simulatorTitle }: { textTitle?: string; simulatorTitle?: string }) => {
  return (
    <Container>
      <div className="fr-col-12 fr-col-lg-6">
        <WrappedText
          title={textTitle}
          body={`
::white-arrow-item[Le coup de pouce **« Chauffage des bâtiments résidentiels collectifs et tertiaires »** permet d’obtenir des aides financières conséquentes pour se raccorder.]
::white-arrow-item[*Le coût du raccordement peut ainsi être réduit à quelques centaines d’euros par logement* (en fonction de la situation du bâtiment et de ses besoins en chaleur).]
::white-arrow-item[Différentes entreprises signataires de la charte « Chauffage des bâtiments résidentiels collectifs et tertiaires » offrent cette prime. **Le montant de la prime peut significativement varier d’une entreprise à l’autre, il est donc important de comparer les offres proposées.**]
        `}
        />
        <div className="fr-btn fr-mt-1w fr-ml-4w">
          <Link href="/ressources/aides#contenu">Tout savoir sur cette aide</Link>
        </div>
      </div>
      <div>
        {simulatorTitle && <Title>{simulatorTitle}</Title>}
        <Simulator cartridge></Simulator>
      </div>
    </Container>
  );
};

export default Simulators;
