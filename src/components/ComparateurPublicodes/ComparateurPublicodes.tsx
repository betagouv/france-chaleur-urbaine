import { fr } from '@codegouvfr/react-dsfr';
import { CallOut } from '@codegouvfr/react-dsfr/CallOut';
import { useSearchParams } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import React from 'react';

import AddressAutocomplete from '@/components/form/dsfr/AddressAutocompleteInput';
import { FormProvider } from '@/components/form/publicodes/FormProvider';
import Label from '@/components/form/publicodes/Label';
import Accordion from '@/components/ui/Accordion';
import Alert from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import Drawer from '@/components/ui/Drawer';
import { FCUArrowIcon } from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Notice from '@/components/ui/Notice';
import Section, { SectionContent, SectionHeading } from '@/components/ui/Section';
import Text from '@/components/ui/Text';
import useEligibilityForm from '@/hooks/useEligibilityForm';
import { type LocationInfoResponse } from '@/pages/api/location-infos';
import { useServices } from '@/services';
import { type AddressDetail } from '@/types/HeatNetworksResponse';
import cx from '@/utils/cx';
import { postFetchJSON } from '@/utils/network';
import { slugify } from '@/utils/strings';
import { ObjectEntries } from '@/utils/typescript';

import { FloatingButton, Results, Simulator } from './ComparateurPublicodes.style';
import DebugDrawer from './DebugDrawer';
import Graph from './Graph';
import { addresseToPublicodesRules } from './mappings';
import ModesDeChauffageAComparer from './ModesDeChauffageAComparer';
import ParametresDesModesDeChauffage from './ParametresDesModesDeChauffage';
import ParametresDuBatimentGrandPublic from './ParametresDuBatimentGrandPublic';
import ParametresDuBatimentTechnicien from './ParametresDuBatimentTechnicien';
import { ResultsNotAvailable, simulatorTabs } from './Placeholder';
import useSimulatorEngine from './useSimulatorEngine';

type ComparateurPublicodesProps = React.HTMLAttributes<HTMLDivElement> & {
  displayMode: 'technicien' | 'grand public';
  tabId: TabId;
};

export type TabId = (typeof simulatorTabs)[number]['tabId'];

const ComparateurPublicodes: React.FC<ComparateurPublicodesProps> = ({
  children,
  className,
  displayMode: defaultDisplayMode,
  tabId: defaultTabId,
  ...props
}) => {
  const engine = useSimulatorEngine();
  const [loading, setLoading] = React.useState(true);
  const searchParams = useSearchParams();

  const [graphDrawerOpen, setGraphDrawerOpen] = React.useState(false);
  const engineDisplayMode = engine.getField('mode affichage');
  const [displayMode] = React.useState<ComparateurPublicodesProps['displayMode']>(defaultDisplayMode || engineDisplayMode);
  const advancedMode = displayMode === 'technicien';

  const [address, setAddress] = useQueryState('address');
  const [addressDetail, setAddressDetail] = React.useState<AddressDetail>();
  const [modesDeChauffage] = useQueryState('modes-de-chauffage');
  const [lngLat, setLngLat] = React.useState<[number, number]>();
  const [nearestReseauDeChaleur, setNearestReseauDeChaleur] = React.useState<LocationInfoResponse['nearestReseauDeChaleur']>();
  const [addressError, setAddressError] = React.useState<boolean>(false);
  const [nearestReseauDeFroid, setNearestReseauDeFroid] = React.useState<LocationInfoResponse['nearestReseauDeFroid']>();
  const inclureLaClimatisation = engine.getField('Inclure la climatisation');
  const { heatNetworkService } = useServices();
  const [selectedTabId, setSelectedTabId] = useQueryState(
    'tabId',
    parseAsStringLiteral(simulatorTabs.map((tab) => tab.tabId)).withDefault(defaultTabId ?? 'batiment')
  );

  React.useEffect(() => {
    if (engine.loaded) {
      if (address) {
        // if address is set, engine will need to compute the result
        // so we wait a bit to make sure the result is ready
        // TODO this is a hack, we should use a proper state from the engine
        setTimeout(() => {
          setLoading(false);
        }, 2000);
      } else {
        setLoading(false);
      }
    }
  }, [engine.loaded, address]);

  const isAddressSelected = engine.getField('code département') !== undefined;

  const displayResults = isAddressSelected && !!modesDeChauffage;

  const { open: displayContactForm, EligibilityFormModal } = useEligibilityForm({
    id: `eligibility-form-comparateur`,
    address: {
      address,
      coordinates: lngLat,
      addressDetails: addressDetail,
    },
  });

  const lienEtudeAmorce = (
    <div className="fr-text--xs">
      Voir le{' '}
      <a
        href="https://amorce.asso.fr/publications/enquete-sur-le-prix-de-vente-de-la-chaleur-et-du-froid-en-2021-rce39"
        target="_blank"
        rel="noopener noreferrer"
      >
        rapport d'Amorce
      </a>{' '}
      pour plus d'informations ou{' '}
      <a href="https://amorce.asso.fr/contact" target="_blank" rel="noopener noreferrer">
        contacter l'association Amorce
      </a>
      .
    </div>
  );

  const noticePDP = (
    <Notice variant="warning" size="xs" className="mt-2">
      Votre adresse est dans le périmètre de développement prioritaire du réseau. Une obligation de raccordement peut exister{' '}
      <Link isExternal href="/ressources/obligations-raccordement#contenu">
        (en savoir plus)
      </Link>
      .
    </Notice>
  );

  const results = displayResults ? (
    <div className="p-2 lg:p-0">
      {!loading && address && displayResults && (
        <Alert size="sm" className="mb-5" variant={nearestReseauDeChaleur ? 'info' : 'warning'}>
          {nearestReseauDeChaleur ? (
            <>
              Le réseau de chaleur{' '}
              <Link
                href={`/reseaux/${nearestReseauDeChaleur['Identifiant reseau']}?address=${encodeURIComponent(address as string)}`}
                isExternal
              >
                <strong>{nearestReseauDeChaleur.nom_reseau}</strong>
              </Link>{' '}
              est à <strong>{nearestReseauDeChaleur.distance}m</strong> de votre adresse.
              {!nearestReseauDeChaleur?.PM && (
                <Text color="warning" my="1v" size="xs">
                  À noter qu’en l'absence de données tarifaires pour ce réseau, les simulations se basent sur le prix de la chaleur moyen
                  des réseaux français.
                </Text>
              )}
              {addressDetail?.network.inPDP && noticePDP}
              <p className="text-sm my-5">
                Vous souhaitez recevoir des informations adaptées à votre bâtiment de la part du gestionnaire du réseau ? Nous assurons
                votre mise en relation !
              </p>
              <div className="flex gap-5 items-center justify-end">
                {lngLat && (
                  <Link
                    isExternal
                    href={`/carte?coord=${lngLat.join(',')}&zoom=17&address=${encodeURIComponent(address as string)}`}
                    className="fr-block"
                  >
                    <strong>Visualiser sur la carte</strong>
                  </Link>
                )}
                <Button onClick={displayContactForm} size="small">
                  Être mis en relation avec le gestionnaire
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm flex flex-col gap-5">
              <div>
                {advancedMode ? (
                  <>
                    <span>
                      En l'absence d'un <strong>réseau de chaleur</strong> à proximité,{' '}
                      <strong>les simulations se basent sur le réseau de chaleur français moyen.</strong>
                    </span>
                    {lienEtudeAmorce}
                  </>
                ) : (
                  <span>
                    Pas de <strong>réseau de chaleur</strong> à proximité.
                  </span>
                )}
              </div>
              <div className="flex sm:flex-row flex-col gap-5 items-center justify-between">
                <p className="text-sm">Vous souhaitez faire connaître à la collectivité votre intérêt pour ce mode de chauffage ?</p>
                <Button onClick={displayContactForm} size="small" className="whitespace-nowrap">
                  Laissez vos coordonnées
                </Button>
              </div>
            </div>
          )}
        </Alert>
      )}
      {!loading && inclureLaClimatisation && address && displayResults && (
        <Alert size="sm" className="mb-5" variant={nearestReseauDeFroid ? 'info' : 'warning'}>
          {nearestReseauDeFroid ? (
            <>
              Le réseau de froid{' '}
              <Link
                href={`/reseaux/${nearestReseauDeFroid['Identifiant reseau']}?address=${encodeURIComponent(address as string)}`}
                isExternal
              >
                <strong>{nearestReseauDeFroid.nom_reseau}</strong>
              </Link>{' '}
              est à <strong>{nearestReseauDeFroid.distance}m</strong> de votre adresse.
              <Text color="warning" my="1v" size="xs">
                À noter qu’en l'absence de données tarifaires pour ce réseau, les simulations se basent sur le prix du froid moyen des
                réseaux français.
              </Text>
              {addressDetail?.network.inPDP && noticePDP}
              {lngLat && (
                <div className="fr-text--xs">
                  <Link
                    isExternal
                    href={`/carte?coord=${lngLat.join(',')}&zoom=17&address=${encodeURIComponent(address as string)}`}
                    className="fr-block"
                  >
                    <strong>Visualiser sur la carte</strong>
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="text-sm flex flex-col gap-5">
              <div>
                {advancedMode ? (
                  <>
                    <span>
                      En l'absence d'un <strong>réseau de froid</strong> à proximité,{' '}
                      <strong>les simulations se basent sur le réseau de froid français moyen.</strong>
                    </span>
                    {lienEtudeAmorce}
                  </>
                ) : (
                  <span>
                    Pas de <strong>réseau de froid</strong> à proximité.
                  </span>
                )}
              </div>
            </div>
          )}
        </Alert>
      )}
      <Graph
        engine={engine}
        advancedMode={advancedMode}
        hideReseauDeChaleur={!advancedMode && !nearestReseauDeChaleur}
        usedReseauDeChaleurLabel={nearestReseauDeChaleur?.nom_reseau || 'Valeur moyenne'}
        captureImageName={`${new Date().getFullYear()}-${slugify(address)}`}
      />
    </div>
  ) : (
    <>
      <CallOut className="mb-5 font-bold">
        {!isAddressSelected
          ? '1. Commencez par sélectionner une adresse'
          : !modesDeChauffage
            ? '2. Maintenant, sélectionnez au moins un mode de chauffage'
            : ''}
      </CallOut>
      <ResultsNotAvailable />
    </>
  );
  return (
    <>
      <EligibilityFormModal />
      <div className={cx(fr.cx('fr-container'), className)} {...props}>
        {!advancedMode && (
          <Notice variant="info" size="sm">
            <span className="flex sm:flex-row flex-col gap-2">
              <span>
                Pour comparer d'autres modes de chauffage et pouvoir modifier l'ensemble des paramètres de calcul, un mode avancé est
                disponible sur connexion.
              </span>
              <Button
                variant="info"
                className="whitespace-nowrap"
                priority="secondary"
                size="small"
                href={`/pro/comparateur-couts-performances?${searchParams.toString()}`}
              >
                Accéder au mode avancé
              </Button>
            </span>
          </Notice>
        )}
        <FormProvider engine={engine}>
          <Simulator $loading={loading}>
            <div className="flex flex-col gap-4">
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
                  excludeCities
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
                    const network = await heatNetworkService.findByCoords(selectedAddress);
                    setAddressDetail({
                      network,
                      geoAddress: selectedAddress,
                    });
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
                {advancedMode ? <ParametresDuBatimentTechnicien engine={engine} /> : <ParametresDuBatimentGrandPublic engine={engine} />}
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
                  advancedMode={advancedMode}
                />
                {advancedMode && (
                  <Button onClick={() => setSelectedTabId(simulatorTabs[2].tabId)} full disabled={!modesDeChauffage} className="fr-mt-2w">
                    Continuer
                  </Button>
                )}
              </Accordion>
              {advancedMode && (
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
            </div>
            <Results>{results}</Results>
            <FloatingButton onClick={() => setGraphDrawerOpen(true)} iconId="ri-arrow-up-fill">
              Voir les résultats
            </FloatingButton>
            <Drawer open={graphDrawerOpen} onClose={() => setGraphDrawerOpen(false)} direction="right" full>
              <div className="max-w-full overflow-auto">{results}</div>
            </Drawer>
            <DebugDrawer engine={engine} />
          </Simulator>
        </FormProvider>
      </div>
      {!loading && (
        <Section variant="light">
          <SectionHeading size="h3">Une suggestion ou une remarque&nbsp;?</SectionHeading>
          <SectionContent className="flex items-center gap-2">
            <FCUArrowIcon />
            <div className="fr-text--lg !mb-0">Faites nous part de vos retours et suggestions sur ce comparateur</div>
          </SectionContent>
          <Link variant="secondary" href="/contact?reason=comparateur" className="fr-mt-2w">
            Nous contacter
          </Link>
        </Section>
      )}
    </>
  );
};

export default ComparateurPublicodes;
