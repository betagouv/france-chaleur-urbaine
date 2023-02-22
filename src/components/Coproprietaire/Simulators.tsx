import MarkdownWrapper from '@components/MarkdownWrapper';
import Simulator from '@components/Ressources/Contents/Simulator';
import SimulatorCO2 from '@components/SimulatorCO2';
import { TypeSurf } from '@components/SimulatorCO2/SimulatorCO2.businessRule';
import { Container } from './Infographies.styles';

const Simulators = () => {
  return (
    <Container>
      <SimulatorCO2 typeSurf={TypeSurf.copropriete} />
      <Simulator cartridge>
        <MarkdownWrapper
          value={`
:::puce-icon{icon="/icons/picto-warning.svg" className="fr-mt-2w"}
Différentes entreprises signataires de la charte « Chauffage des bâtiments résidentiels collectifs et tertiaires » offrent cette prime. Le montant proposé peut significativement varier d’une entreprise à l’autre, il est donc important de comparer les offres.
:button-link[Tout savoir sur cette aide]{href="/ressources/aides" className="fr-btn--secondary fr-mt-1w"}
`}
        />
      </Simulator>
    </Container>
  );
};

export default Simulators;
