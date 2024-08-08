import { fr } from '@codegouvfr/react-dsfr';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import Drawer from '@mui/material/Drawer';
import { useQueryState } from 'nuqs';
import React from 'react';

import { FormProvider } from '@components/form/publicodes/FormProvider';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import cx from '@utils/cx';

import GrandPublicForm from './GrandPublicForm';
import PublicodesSimulatorResults from './Results';
import { FloatingButton, Results, Section, Simulator } from './SimulatorPublicodes.style';
import TechnicienParametresEconomiques from './TechnicienParametresEconomiques';
import TechnicienParametresTechniques from './TechnicienParametresTechniques';
import useSimulatorEngine from './useSimulatorEngine';

type PublicodesSimulatorProps = React.HTMLAttributes<HTMLDivElement> & {
  // TODO
};

export type TabId = 'batiment' | 'modes';

const PublicodesSimulator: React.FC<PublicodesSimulatorProps> = ({ children, className, ...props }) => {
  const engine = useSimulatorEngine();
  const [open, setOpen] = React.useState(false);
  const engineDisplayMode = engine.getField('mode affichage');
  const [displayMode, setDisplayMode] = useQueryState('displayMode', { defaultValue: engineDisplayMode as string });
  const [selectedTabId, setSelectedTabId] = useQueryState('tabId', { defaultValue: 'techniques' });

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  React.useEffect(() => {
    // In case displayMode is set through url query param, we need to update the engine
    if (displayMode !== engineDisplayMode) {
      engine.setStringField('mode affichage', displayMode);
    }
  }, [displayMode, engineDisplayMode]);

  const results = <PublicodesSimulatorResults className="" engine={engine} />;

  return (
    <div className={cx(fr.cx('fr-container'), className)} {...props}>
      <FormProvider engine={engine}>
        <Section>
          <header>
            <div>
              <Heading as="h2">Simulateur de prix et d'émissions de CO2</Heading>
              <Text size="sm" fontStyle="italic">
                Année de référence : 2022 pour les réseaux de chaleur, 2024 pour les autres modes de chauffage
              </Text>
            </div>
            <ToggleSwitch
              label="Mode pro"
              labelPosition="left"
              inputTitle="Mode Pro"
              showCheckedHint={false}
              checked={displayMode === 'technicien'}
              className={fr.cx('fr-mt-0')}
              onChange={(checked) => {
                const newValue = checked ? 'technicien' : 'grand public';
                setDisplayMode(newValue);
                engine.setStringField('mode affichage', newValue);
              }}
            />
          </header>
          <Simulator>
            <div>
              {displayMode === 'grand public' ? (
                <GrandPublicForm engine={engine} />
              ) : (
                <Tabs
                  selectedTabId={selectedTabId}
                  tabs={[
                    {
                      tabId: 'techniques',
                      label: (
                        <small>
                          Paramètres
                          <br />
                          techniques
                        </small>
                      ),
                    },
                    {
                      tabId: 'economiques',
                      label: (
                        <small>
                          Paramètres
                          <br />
                          économiques
                        </small>
                      ),
                    },
                  ]}
                  onTabChange={(newTabId) => setSelectedTabId(newTabId as TabId)}
                >
                  {selectedTabId === 'techniques' && <TechnicienParametresTechniques engine={engine} />}
                  {selectedTabId === 'economiques' && <TechnicienParametresEconomiques engine={engine} />}
                </Tabs>
              )}
            </div>
            <Results>{results}</Results>
            <FloatingButton onClick={toggleDrawer(true)} iconId="ri-arrow-up-fill">
              Voir les résultats
            </FloatingButton>
            <Drawer open={open} onClose={toggleDrawer(false)} anchor="right">
              {results}
            </Drawer>
          </Simulator>
        </Section>
      </FormProvider>
    </div>
  );
};

export default PublicodesSimulator;
