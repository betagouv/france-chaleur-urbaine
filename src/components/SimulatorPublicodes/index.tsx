import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { fr } from '@codegouvfr/react-dsfr';
import Alert from '@codegouvfr/react-dsfr/Alert';
import Button from '@codegouvfr/react-dsfr/Button';
import Tabs from '@codegouvfr/react-dsfr/Tabs';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import Drawer from '@mui/material/Drawer';
import { useQueryState } from 'nuqs';
import React from 'react';

import AddressAutocomplete from '@components/form/dsfr/AddressAutocompleteInput';
import { FormProvider } from '@components/form/publicodes/FormProvider';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import { type LocationInfoResponse } from '@pages/api/location-infos';
import cx from '@utils/cx';
import { postFetchJSON } from '@utils/network';
import { ObjectEntries } from '@utils/typescript';

import DebugDrawer from './DebugDrawer';
import GrandPublicForm from './GrandPublicForm';
import PublicodesSimulatorResults from './Results';
import { FloatingButton, Results, ResultsPlaceholder, Section, Simulator } from './SimulatorPublicodes.style';
import TechnicienParametresEconomiques from './TechnicienParametresEconomiques';
import TechnicienParametresTechniques from './TechnicienParametresTechniques';
import useSimulatorEngine from './useSimulatorEngine';

type PublicodesSimulatorProps = React.HTMLAttributes<HTMLDivElement> & {
  displayMode: string;
  tabId: string;
};

export type TabId = 'batiment' | 'modes';

const addresseToPublicodesRules = {
  'caractéristique réseau de chaleur . contenu CO2': (infos) => infos.nearestReseauDeChaleur?.['contenu CO2'],
  'caractéristique réseau de chaleur . contenu CO2 ACV': (infos) => infos.nearestReseauDeChaleur?.['contenu CO2 ACV'],
  'caractéristique réseau de chaleur . coût résidentiel': (infos) => infos.nearestReseauDeChaleur?.['PM_L'],
  'caractéristique réseau de chaleur . coût tertiaire': (infos) => infos.nearestReseauDeChaleur?.['PM_T'],
  'caractéristique réseau de chaleur . livraisons totales': (infos) => infos.nearestReseauDeChaleur?.['livraisons_totale_MWh'],
  'caractéristique réseau de chaleur . part fixe': (infos) => infos.nearestReseauDeChaleur?.['PF%'],
  'caractéristique réseau de chaleur . part variable': (infos) => infos.nearestReseauDeChaleur?.['PV%'],
  'caractéristique réseau de chaleur . prix moyen': (infos) => infos.nearestReseauDeChaleur?.['PM'],
  'caractéristique réseau de chaleur . production totale': (infos) => infos.nearestReseauDeChaleur?.['production_totale_MWh'],
  'caractéristique réseau de chaleur . taux EnRR': (infos) => infos.nearestReseauDeChaleur?.['Taux EnR&R'],

  'caractéristique réseau de froid . contenu CO2': (infos) => infos.nearestReseauDeFroid?.['contenu CO2'],
  'caractéristique réseau de froid . contenu CO2 ACV': (infos) => infos.nearestReseauDeFroid?.['contenu CO2 ACV'],
  'caractéristique réseau de froid . livraisons totales': (infos) => infos.nearestReseauDeFroid?.['livraisons_totale_MWh'],
  'caractéristique réseau de froid . production totale': (infos) => infos.nearestReseauDeFroid?.['production_totale_MWh'],

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
  const [loading, setLoading] = React.useState(true);

  const [graphDrawerOpen, setGraphDrawerOpen] = React.useState(false);
  const engineDisplayMode = engine.getField('mode affichage');
  const [displayMode, setDisplayMode] = useQueryState('displayMode', { defaultValue: defaultDisplayMode || (engineDisplayMode as string) });
  const [address, setAddress] = useQueryState('address');
  const [lngLat, setLngLat] = React.useState<[number, number]>();
  const [nearestReseauDeChaleur, setNearestReseauDeChaleur] = React.useState<LocationInfoResponse['nearestReseauDeChaleur']>();
  const [addressError, setAddressError] = React.useState<boolean>(false);
  const [nearestReseauDeFroid, setNearestReseauDeFroid] = React.useState<LocationInfoResponse['nearestReseauDeFroid']>();

  const [selectedTabId, setSelectedTabId] = useQueryState('tabId', { defaultValue: defaultTabId || 'techniques' });

  React.useEffect(() => {
    if (engine.loaded) {
      if (address) {
        // if address is set, engine will need to compute the result
        // so we wait a bit to make sure the result is ready
        // FIXME this is a hack, we should use a proper state from the engine
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      } else {
        setLoading(false);
      }
    }
  }, [engine.loaded, address]);

  React.useEffect(() => {
    // In case displayMode is set through url query param, we need to update the engine
    if (displayMode !== engineDisplayMode) {
      engine.setStringField('mode affichage', displayMode);
    }
  }, [displayMode, engineDisplayMode]);

  const isAddressSelected = engine.getField('code département') !== undefined;
  const results = isAddressSelected ? (
    <PublicodesSimulatorResults engine={engine} />
  ) : (
    <ResultsPlaceholder>
      <img src="/img/simulateur_placeholder.svg" alt="" />
      <div>Les résultats s’afficheront ici une fois le formulaire rempli</div>
    </ResultsPlaceholder>
  );

  return (
    <div className={cx(fr.cx('fr-container'), className)} {...props}>
      <FormProvider engine={engine}>
        <Section>
          <header>
            <div>
              <Heading as="h2">Simulateur de prix et d'émissions de CO2</Heading>
              <ol>
                <li>
                  Renseignez les données de votre bâtiment dans <strong>l’onglet “Bâtiment”</strong>
                </li>
                <li>
                  Selectionnez les modes de chauffages et de refroidissement que vous souhaitez comparer dans{' '}
                  <strong>l’onglet “Modes de chauffage et de refroidissement”</strong>
                </li>
              </ol>
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
          <Simulator $loading={loading}>
            <div>
              <AddressAutocomplete
                label="Adresse"
                state={addressError ? 'error' : undefined}
                stateRelatedMessage={
                  addressError ? 'Désolé, nous n’avons pas trouvé la ville associée à cette adresse, essayez avec une autre' : undefined
                }
                hintText={
                  lngLat && (
                    <Link
                      isExternal
                      href={`/carte?coord=${lngLat.join(',')}&zoom=17&proMode=${displayMode === 'technicien' ? 'true' : 'false'}`}
                    >
                      Voir les réseaux à proximité sur la carte
                    </Link>
                  )
                }
                defaultValue={address || ''}
                onClear={() => {
                  setNearestReseauDeChaleur(undefined);
                  setNearestReseauDeFroid(undefined);
                  setAddressError(false);
                  setAddress(null);
                  setLngLat(undefined);

                  engine.setSituation(
                    ObjectEntries(addresseToPublicodesRules).reduce(
                      (acc, [key]) => ({
                        ...acc,
                        [key]: null,
                      }),
                      {}
                    )
                  );
                }}
                onSelect={async (selectedAddress) => {
                  setAddressError(false);
                  setLngLat(undefined);

                  const [lon, lat] = selectedAddress.geometry.coordinates;
                  const addressLabel = selectedAddress.properties.label;
                  if (addressLabel !== address) {
                    setAddress(null);
                  }

                  const infos: LocationInfoResponse = await postFetchJSON('/api/location-infos', {
                    lon,
                    lat,
                    city: selectedAddress.properties.city,
                    cityCode: selectedAddress.properties.citycode,
                  });
                  setNearestReseauDeChaleur(infos.nearestReseauDeChaleur);
                  setNearestReseauDeFroid(infos.nearestReseauDeFroid);

                  if (!infos.infosVilles) {
                    setAddressError(true);

                    return;
                  }

                  setAddress(addressLabel);

                  if (infos.nearestReseauDeChaleur || infos.nearestReseauDeFroid) {
                    setLngLat(selectedAddress.geometry.coordinates);
                  }

                  console.debug('locations-infos', infos);

                  engine.setSituation(
                    ObjectEntries(addresseToPublicodesRules).reduce(
                      (acc, [key, infoGetter]) => ({
                        ...acc,
                        [key]: infoGetter(infos) ?? null,
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
            <Results>
              {nearestReseauDeChaleur && (
                <Alert
                  className="fr-mb-2w"
                  description={
                    <>
                      Le réseau de chaleur{' '}
                      <Link href={`/reseaux/${nearestReseauDeChaleur['Identifiant reseau']}`} isExternal>
                        <strong>{nearestReseauDeChaleur.nom_reseau}</strong>
                      </Link>{' '}
                      est à <strong>{nearestReseauDeChaleur.distance}</strong>m de votre adresse.
                    </>
                  }
                  severity="info"
                  small
                />
              )}
              {nearestReseauDeFroid && (
                <Alert
                  className="fr-mb-2w"
                  description={
                    <>
                      Le réseau de froid{' '}
                      <Link href={`/reseaux/${nearestReseauDeFroid['Identifiant reseau']}`} isExternal>
                        <strong>{nearestReseauDeFroid.nom_reseau}</strong>
                      </Link>{' '}
                      est à <strong>{nearestReseauDeFroid.distance}</strong>m de votre adresse.
                    </>
                  }
                  severity="info"
                  small
                />
              )}
              {results}
            </Results>
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
