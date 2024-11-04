import { DottedName } from '@betagouv/france-chaleur-urbaine-publicodes';
import { fr } from '@codegouvfr/react-dsfr';
import Alert from '@codegouvfr/react-dsfr/Alert';
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch';
import Drawer from '@mui/material/Drawer';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import React from 'react';

import AddressAutocomplete from '@components/form/dsfr/AddressAutocompleteInput';
import { FormProvider } from '@components/form/publicodes/FormProvider';
import Label from '@components/form/publicodes/Label';
import Accordion from '@components/ui/Accordion';
import Box from '@components/ui/Box';
import Button from '@components/ui/Button';
import Link from '@components/ui/Link';
import { type LocationInfoResponse } from '@pages/api/location-infos';
import cx from '@utils/cx';
import { postFetchJSON } from '@utils/network';
import { ObjectEntries } from '@utils/typescript';

import { FloatingButton, Results, Section, Simulator } from './ComparateurPublicodes.style';
import DebugDrawer from './DebugDrawer';
import Graph from './Graph';
import ModesDeChauffageAComparer from './ModesDeChauffageAComparer';
import ParametresDesModesDeChauffage from './ParametresDesModesDeChauffage';
import ParametresDuBatimentGrandPublic from './ParametresDuBatimentGrandPublic';
import ParametresDuBatimentTechnicien from './ParametresDuBatimentTechnicien';
import { ComparateurPublicodesTitle, ResultsNotAvailable, simulatorTabs } from './Placeholder';
import useSimulatorEngine from './useSimulatorEngine';

type ComparateurPublicodesProps = React.HTMLAttributes<HTMLDivElement> & {
  displayMode: string;
  tabId: TabId;
};

export type TabId = (typeof simulatorTabs)[number]['tabId'];

const addresseToPublicodesRules = {
  'caractéristique réseau de chaleur . contenu CO2': (infos) => infos.nearestReseauDeChaleur?.['contenu CO2'],
  'caractéristique réseau de chaleur . contenu CO2 ACV': (infos) => infos.nearestReseauDeChaleur?.['contenu CO2 ACV'],
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

  'code département': (infos) => `'${infos.infosVille.departement_id}'`,
  'température de référence chaud commune': (infos) => +infos.infosVille.temperature_ref_altitude_moyenne,
} as const satisfies Partial<Record<DottedName, (infos: LocationInfoResponse) => any>>;

const ComparateurPublicodes: React.FC<ComparateurPublicodesProps> = ({
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
  const [displayMode, setDisplayMode] = useQueryState('displayMode', {
    defaultValue: defaultDisplayMode || (engineDisplayMode as string),
  });

  const [address, setAddress] = useQueryState('address');
  const [modesDeChauffage] = useQueryState('modes-de-chauffage');
  const [lngLat, setLngLat] = React.useState<[number, number]>();
  const [nearestReseauDeChaleur, setNearestReseauDeChaleur] = React.useState<LocationInfoResponse['nearestReseauDeChaleur']>();
  const [addressError, setAddressError] = React.useState<boolean>(false);
  const [nearestReseauDeFroid, setNearestReseauDeFroid] = React.useState<LocationInfoResponse['nearestReseauDeFroid']>();

  const [selectedTabId, setSelectedTabId] = useQueryState(
    'tabId',
    parseAsStringLiteral(simulatorTabs.map((tab) => tab.tabId)).withDefault(defaultTabId ?? 'batiment')
  );

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

  const results =
    isAddressSelected && !!modesDeChauffage ? <Graph engine={engine} proMode={displayMode === 'technicien'} /> : <ResultsNotAvailable />;

  return (
    <div className={cx(fr.cx('fr-container'), className)} {...props}>
      <FormProvider engine={engine}>
        <Section>
          <header>
            <ComparateurPublicodesTitle />
            <ToggleSwitch
              label="Mode&nbsp;avancé"
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
            <Box display="flex" gap="16px" flexDirection="column">
              <Accordion
                expanded={selectedTabId === simulatorTabs[0].tabId}
                onExpandedChange={(expanded) => (expanded ? setSelectedTabId(simulatorTabs[0].tabId) : setSelectedTabId(null))}
                bordered
                label={
                  <div>
                    {simulatorTabs[0].label}
                    {address && selectedTabId !== simulatorTabs[0].tabId && (
                      <div className={fr.cx('fr-text--xs', 'fr-text--light')}>{address}</div>
                    )}
                  </div>
                }
              >
                <AddressAutocomplete
                  label={
                    <Label
                      label="Adresse"
                      help="Pour le moment, l’adresse est utilisée uniquement pour évaluer la proximité aux réseaux de chaleur et froid et la zone climatique, et non pour récupérer les caractéristiques du bâtiment"
                    ></Label>
                  }
                  state={addressError ? 'error' : undefined}
                  stateRelatedMessage={
                    addressError ? 'Désolé, nous n’avons pas trouvé la ville associée à cette adresse, essayez avec une autre' : undefined
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

                    if (!infos.infosVille) {
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
                  <ParametresDuBatimentGrandPublic engine={engine} />
                ) : (
                  <ParametresDuBatimentTechnicien engine={engine} />
                )}
                <Button onClick={() => setSelectedTabId(simulatorTabs[1].tabId)} full disabled={!isAddressSelected} className="fr-mt-2w">
                  Continuer
                </Button>
              </Accordion>
              <Accordion
                expanded={selectedTabId === simulatorTabs[1].tabId}
                onExpandedChange={(expanded) => (expanded ? setSelectedTabId(simulatorTabs[1].tabId) : setSelectedTabId(null))}
                disabled={!isAddressSelected}
                bordered
                label={simulatorTabs[1].label}
              >
                <ModesDeChauffageAComparer
                  engine={engine}
                  nearestReseauDeChaleur={nearestReseauDeChaleur}
                  nearestReseauDeFroid={nearestReseauDeFroid}
                />
                {displayMode === 'technicien' && (
                  <Button onClick={() => setSelectedTabId(simulatorTabs[2].tabId)} full disabled={!modesDeChauffage} className="fr-mt-2w">
                    Continuer
                  </Button>
                )}
              </Accordion>
              {displayMode === 'technicien' && (
                <Accordion
                  expanded={selectedTabId === simulatorTabs[2].tabId}
                  onExpandedChange={(expanded) => (expanded ? setSelectedTabId(simulatorTabs[2].tabId) : setSelectedTabId(null))}
                  disabled={!isAddressSelected}
                  bordered
                  label={simulatorTabs[2].label}
                >
                  <ParametresDesModesDeChauffage engine={engine} />
                </Accordion>
              )}
            </Box>
            <Results>
              {nearestReseauDeChaleur && (
                <Alert
                  className="fr-mb-2w"
                  description={
                    <>
                      Le réseau de chaleur{' '}
                      <Link
                        href={`/reseaux/${nearestReseauDeChaleur['Identifiant reseau']}?address=${encodeURIComponent(address as string)}`}
                        isExternal
                      >
                        <strong>{nearestReseauDeChaleur.nom_reseau}</strong>
                      </Link>{' '}
                      est à <strong>{nearestReseauDeChaleur.distance}m</strong> de votre adresse.
                      {lngLat && (
                        <div className="fr-text--xs">
                          <Link isExternal href={`/carte?coord=${lngLat.join(',')}&zoom=17`} className="fr-block">
                            <strong>Visualiser sur la carte</strong>
                          </Link>
                        </div>
                      )}
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
                      <Link
                        href={`/reseaux/${nearestReseauDeFroid['Identifiant reseau']}?address=${encodeURIComponent(address as string)}`}
                        isExternal
                      >
                        <strong>{nearestReseauDeFroid.nom_reseau}</strong>
                      </Link>{' '}
                      est à <strong>{nearestReseauDeFroid.distance}m</strong> de votre adresse.
                      {lngLat && (
                        <div className="fr-text--xs">
                          <Link isExternal href={`/carte?coord=${lngLat.join(',')}&zoom=17`} className="fr-block">
                            <strong>Visualiser sur la carte</strong>
                          </Link>
                        </div>
                      )}
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
              <div style={{ maxWidth: '100vw', overflow: 'auto' }}>{results}</div>
            </Drawer>
            <DebugDrawer engine={engine} />
          </Simulator>
        </Section>
      </FormProvider>
    </div>
  );
};

export default ComparateurPublicodes;
