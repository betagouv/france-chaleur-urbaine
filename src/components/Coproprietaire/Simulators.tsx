import { matomoEvent } from '@components/Markup';
import Simulator from '@components/Ressources/Contents/Simulator';
import SimulatorCO2 from '@components/SimulatorCO2';
import { TypeSurf } from '@components/SimulatorCO2/SimulatorCO2.businessRule';
import { Button } from '@dataesr/react-dsfr';
import { Container } from './Infographies.styles';
import { Guide } from './Simulators.styles';

const Simulators = () => {
  return (
    <Container>
      <SimulatorCO2 typeSurf={TypeSurf.copropriete} />
      <Simulator cartridge>
        <Guide>
          <img src="/img/copro_small_guide.jpg" alt="guide de raccordement" />
          <div>
            <p>Retrouvez toutes les infos dans notre guide de raccordement</p>
            <Button
              onClick={() => {
                matomoEvent(['Téléchargement', 'Guide FCU', 'coproprietaire']);
                window.open(
                  '/documentation/guide-france-chaleur-urbaine.pdf',
                  '_blank'
                );
              }}
            >
              Télécharger le guide
            </Button>
          </div>
        </Guide>
      </Simulator>
    </Container>
  );
};

export default Simulators;
