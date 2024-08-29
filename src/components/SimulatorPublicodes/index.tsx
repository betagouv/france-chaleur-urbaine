import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { fr } from '@codegouvfr/react-dsfr';
import Button from '@codegouvfr/react-dsfr/Button';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import Drawer from '@mui/material/Drawer';
import { useQueryState } from 'nuqs';
import React from 'react';

import AddressAutocomplete from '@components/form/dsfr/AddressAutocompleteInput';
import { FormProvider } from '@components/form/publicodes/FormProvider';
import Heading from '@components/ui/Heading';
import Text from '@components/ui/Text';
import cx from '@utils/cx';
import { postFetchJSON } from '@utils/network';
import { ObjectEntries } from '@utils/typescript';

import DebugDrawer from './DebugDrawer';
import GrandPublicForm from './GrandPublicForm';
import PublicodesSimulatorResults from './Results';
import { FloatingButton, Results, Section, Simulator } from './SimulatorPublicodes.style';
import TechnicienParametresEconomiques from './TechnicienParametresEconomiques';
import TechnicienParametresTechniques from './TechnicienParametresTechniques';
import useSimulatorEngine from './useSimulatorEngine';

type PublicodesSimulatorProps = React.HTMLAttributes<HTMLDivElement> & {
  displayMode: string;
  tabId: string;
};

export type TabId = 'batiment' | 'modes';

const addresseToPublicodesRules = {
  'caractéristique réseau de chaleur . contenu CO2': (infos) => infos.nearestReseauDeChaleur['contenu CO2'],
  'caractéristique réseau de chaleur . contenu CO2 ACV': (infos) => infos.nearestReseauDeChaleur['contenu CO2 ACV'],
  'caractéristique réseau de chaleur . coût résidentiel': (infos) => infos.nearestReseauDeChaleur['PM_L'],
  'caractéristique réseau de chaleur . coût tertiaire': (infos) => infos.nearestReseauDeChaleur['PM_T'],
  'caractéristique réseau de chaleur . livraisons totales': (infos) => infos.nearestReseauDeChaleur['livraisons_totale_MWh'],
  'caractéristique réseau de chaleur . part fixe': (infos) => infos.nearestReseauDeChaleur['PF%'],
  'caractéristique réseau de chaleur . part variable': (infos) => infos.nearestReseauDeChaleur['PV%'],
  'caractéristique réseau de chaleur . prix moyen': (infos) => infos.nearestReseauDeChaleur['PM'],
  'caractéristique réseau de chaleur . production totale': (infos) => infos.nearestReseauDeChaleur['production_totale_MWh'],
  'caractéristique réseau de chaleur . taux EnRR': (infos) => infos.nearestReseauDeChaleur['Taux EnR&R'],

  'caractéristique réseau de froid . contenu CO2': (infos) => infos.nearestReseauDeFroid['contenu CO2'],
  'caractéristique réseau de froid . contenu CO2 ACV': (infos) => infos.nearestReseauDeFroid['contenu CO2 ACV'],
  'caractéristique réseau de froid . livraisons totales': (infos) => infos.nearestReseauDeFroid['livraisons_totale_MWh'],
  'caractéristique réseau de froid . production totale': (infos) => infos.nearestReseauDeFroid['production_totale_MWh'],

  'code département': (infos) => `'${infos.infosVilles.departement_id}'`,
  'température de référence chaud': (infos) => +infos.infosVilles.temperature_ref_altitude_moyenne,
} as const satisfies Partial<Record<DottedName, (infos: any) => any>>;

const PublicodesSimulator: React.FC<PublicodesSimulatorProps> = ({
  children,
  className,
  displayMode: defaultDisplayMode,
  tabId: defaultTabId,
  ...props
}) => {
  const engine = useSimulatorEngine();

  const [graphDrawerOpen, setGraphDrawerOpen] = React.useState(false);
  const engineDisplayMode = engine.getField('mode affichage');
  const [displayMode, setDisplayMode] = useQueryState('displayMode', { defaultValue: defaultDisplayMode || (engineDisplayMode as string) });

  const [selectedTabId, setSelectedTabId] = useQueryState('tabId', { defaultValue: defaultTabId || 'techniques' });

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
              <AddressAutocomplete
                label="Adresse"
                onSelect={async (address) => {
                  const infos = await postFetchJSON('/api/location-infos', {
                    lon: address.geometry.coordinates[0],
                    lat: address.geometry.coordinates[1],
                    city: address.properties.city,
                    cityCode: address.properties.citycode,
                  });

                  console.debug('locations-infos', infos);

                  engine.setSituation(
                    ObjectEntries(addresseToPublicodesRules).reduce(
                      (acc, [key, infoGetter]) => ({
                        ...acc,
                        [key]: infoGetter(infos),
                      }),
                      {}
                    )
                  );
                }}
              />
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
            <FloatingButton onClick={() => setGraphDrawerOpen(true)} iconId="ri-arrow-up-fill">
              Voir les résultats
            </FloatingButton>
            <Drawer open={graphDrawerOpen} onClose={() => setGraphDrawerOpen(false)} anchor="right">
              <Button onClick={() => setGraphDrawerOpen(false)}>Fermer</Button>
              {results}
            </Drawer>
            <DebugDrawer engine={engine} />
          </Simulator>
        </Section>
      </FormProvider>
    </div>
  );
};

export default PublicodesSimulator;
