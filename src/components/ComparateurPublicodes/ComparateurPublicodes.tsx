import { fr } from '@codegouvfr/react-dsfr';
import { CallOut } from '@codegouvfr/react-dsfr/CallOut';
import { useSearchParams } from 'next/navigation';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import React, { useState } from 'react';

import Configuration from '@/components/ComparateurPublicodes/Configuration';
import AddressAutocomplete from '@/components/form/dsfr/AddressAutocompleteInput';
import { FormProvider } from '@/components/form/publicodes/FormProvider';
import Label from '@/components/form/publicodes/Label';
import Accordion from '@/components/ui/Accordion';
import Button from '@/components/ui/Button';
import Drawer from '@/components/ui/Drawer';
import { FCUArrowIcon } from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Notice from '@/components/ui/Notice';
import Section, { SectionContent, SectionHeading } from '@/components/ui/Section';
import useEligibilityForm from '@/hooks/useEligibilityForm';
import { trackEvent } from '@/modules/analytics/client';
import useUserInfo from '@/modules/app/client/hooks/useUserInfo';
import trpc from '@/modules/trpc/client';
import type { LocationInfoResponse } from '@/pages/api/location-infos';
import { getNetworkEligibilityDistances } from '@/services/eligibility';
import type { AddressDetail } from '@/types/HeatNetworksResponse';
import cx from '@/utils/cx';
import { postFetchJSON } from '@/utils/network';
import { slugify } from '@/utils/strings';
import { ObjectEntries } from '@/utils/typescript';

import { FloatingButton, Results, Simulator } from './ComparateurPublicodes.style';
import DebugDrawer from './DebugDrawer';
import Graph from './Graph';
import ModesDeChauffageAComparer from './ModesDeChauffageAComparer';
import { addresseToPublicodesRules, modesDeChauffage } from './mappings';
import ParametresDesModesDeChauffage from './ParametresDesModesDeChauffage';
import ParametresDuBatimentGrandPublic from './ParametresDuBatimentGrandPublic';
import ParametresDuBatimentTechnicien from './ParametresDuBatimentTechnicien';
import { ResultsNotAvailable, simulatorTabs } from './Placeholder';
import useSimulatorEngine from './useSimulatorEngine';

type ComparateurPublicodesProps = React.HTMLAttributes<HTMLDivElement> & {
  advancedMode: boolean;
  tabId: TabId;
};

export type TabId = (typeof simulatorTabs)[number]['tabId'];

const ComparateurPublicodes: React.FC<ComparateurPublicodesProps> = ({
  children,
  className,
  tabId: defaultTabId,
  advancedMode,
  ...props
}) => {
  const engine = useSimulatorEngine();
  const [loading, setLoading] = React.useState(true);
  const searchParams = useSearchParams();

  const [graphDrawerOpen, setGraphDrawerOpen] = React.useState(false);
  const [addressInUrl, setAddressInUrl] = useQueryState('address');

  const { userInfo, setUserInfo } = useUserInfo();
  const [addressDetail, setAddressDetail] = React.useState<AddressDetail>();
  const [lngLat, setLngLat] = React.useState<[number, number]>();
  const [modesDeChauffageQueryParam] = useQueryState('modes-de-chauffage');
  const [nearestReseauDeChaleur, setNearestReseauDeChaleur] = React.useState<LocationInfoResponse['nearestReseauDeChaleur']>();
  const [addressError, setAddressError] = React.useState<boolean>(false);
  const [addressLoading, setAddressLoading] = React.useState<boolean>(false);
  const [nearestReseauDeFroid, setNearestReseauDeFroid] = React.useState<LocationInfoResponse['nearestReseauDeFroid']>();
  const inclureLaClimatisation = engine.getField('Inclure la climatisation');
  const trpcUtils = trpc.useUtils();
  const [selectedTabId, setSelectedTabId] = useQueryState(
    'tabId',
    parseAsStringLiteral(simulatorTabs.map((tab) => tab.tabId)).withDefault(defaultTabId ?? 'batiment')
  );

  const [forceReload, setForceReload] = useState(false);

  React.useEffect(() => {
    if (forceReload) setForceReload(false);
  }, [forceReload]);

  React.useEffect(() => {
    if (engine.loaded) {
      if (userInfo.address) {
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
  }, [engine.loaded, userInfo.address]);

  const isAddressSelected = engine.getField('code département') !== undefined;

  const displayGraph = isAddressSelected && (!advancedMode || (advancedMode && !!modesDeChauffageQueryParam));

  React.useEffect(() => {
    engine.setField('Inclure la climatisation', 'non');
    engine.setField('Production eau chaude sanitaire', 'oui');
    engine.setStringField('type de production ECS', 'Avec équipement chauffage');
  }, [advancedMode]);

  const { open: displayContactForm, EligibilityFormModal } = useEligibilityForm({
    address: {
      address: userInfo.address,
      addressDetails: addressDetail,
      coordinates: lngLat,
    },
    context: 'comparateur',
    id: `eligibility-form-comparateur`,
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
    <Notice variant="warning" size="sm" className="mt-2">
      Votre adresse est dans le périmètre de développement prioritaire du réseau. Une obligation de raccordement peut exister{' '}
      <Link isExternal href="/ressources/obligations-raccordement#contenu">
        (en savoir plus)
      </Link>
      .
    </Notice>
  );
  const noticeClasse = (
    <Notice variant="warning" size="sm" className="mt-2">
      Ce réseau est classé, ce qui signifie qu’une obligation de raccordement peut exister{' '}
      <Link isExternal href="/ressources/obligations-raccordement#contenu">
        (en savoir plus)
      </Link>
      .
    </Notice>
  );

  const fileName = `${new Date().getFullYear()}-${slugify(userInfo.address)}`;

  const results = (
    <div className="p-2 lg:p-0">
      {displayGraph && !loading && userInfo.address && (
        <Accordion
          className="mb-5"
          small
          bordered
          label={
            nearestReseauDeChaleur ? (
              <span>
                Réseau de chaleur : <strong>{nearestReseauDeChaleur.nom_reseau}</strong> à{' '}
                <strong>{nearestReseauDeChaleur.distance}m</strong>
              </span>
            ) : (
              <span>Réseau de chaleur : aucun réseau à proximité</span>
            )
          }
        >
          {nearestReseauDeChaleur ? (
            <>
              Le réseau de chaleur{' '}
              <Link href={`/reseaux/${nearestReseauDeChaleur['Identifiant reseau']}`} isExternal>
                <strong>{nearestReseauDeChaleur.nom_reseau}</strong>
              </Link>{' '}
              est à <strong>{nearestReseauDeChaleur.distance}m</strong> de votre adresse.
              {!nearestReseauDeChaleur?.PM && (
                <p className="font-bold fr-my-1v">
                  À noter qu'en l'absence de données tarifaires pour ce réseau, les simulations se basent sur le prix de la chaleur moyen
                  des réseaux français.
                </p>
              )}
              {addressDetail?.network.inPDP ? noticePDP : addressDetail?.network.isClasse ? noticeClasse : undefined}
              <p className="my-2">
                Vous souhaitez recevoir des informations adaptées à votre bâtiment de la part du gestionnaire du réseau ? Nous assurons
                votre mise en relation !
              </p>
              <div className="flex gap-5 items-center justify-end">
                {lngLat && (
                  <Link
                    isExternal
                    href={`/carte?coord=${lngLat.join(',')}&zoom=17&address=${encodeURIComponent(userInfo.address)}`}
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
        </Accordion>
      )}
      {displayGraph && !loading && inclureLaClimatisation && userInfo.address && (
        <Accordion
          className="mb-5"
          small
          bordered
          label={
            nearestReseauDeFroid ? (
              <span>
                Réseau de froid : <strong>{nearestReseauDeFroid.nom_reseau}</strong> à <strong>{nearestReseauDeFroid.distance}m</strong>
              </span>
            ) : (
              <span>Réseau de froid : aucun réseau à proximité</span>
            )
          }
        >
          {nearestReseauDeFroid ? (
            <>
              Le réseau de froid{' '}
              <Link variant="link" href={`/reseaux/${nearestReseauDeFroid['Identifiant reseau']}`} isExternal>
                <strong>{nearestReseauDeFroid.nom_reseau}</strong>
              </Link>{' '}
              est à <strong>{nearestReseauDeFroid.distance}m</strong> de votre adresse.
              <p className="fr-text--sm font-bold fr-my-1v">
                À noter qu'en l'absence de données tarifaires pour ce réseau, les simulations se basent sur le prix du froid moyen des
                réseaux français.
              </p>
              {addressDetail?.network.inPDP ? noticePDP : addressDetail?.network.isClasse ? noticeClasse : undefined}
              {lngLat && (
                <Link
                  isExternal
                  href={`/carte?coord=${lngLat.join(',')}&zoom=17&address=${encodeURIComponent(userInfo.address)}`}
                  className="fr-block text-sm"
                >
                  <strong>Visualiser sur la carte</strong>
                </Link>
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
        </Accordion>
      )}
      {!displayGraph && (
        <CallOut className="mb-5 font-bold">
          {advancedMode
            ? !isAddressSelected
              ? '1. Commencez par renseigner une adresse'
              : '2. Maintenant, sélectionnez au moins un mode de chauffage'
            : 'Renseignez une adresse'}
        </CallOut>
      )}

      {displayGraph ? (
        <Graph
          engine={engine}
          advancedMode={advancedMode}
          reseauDeChaleur={{
            hasPriceData: !!nearestReseauDeChaleur?.PM,
            hide: !advancedMode && !nearestReseauDeChaleur,
            label: nearestReseauDeChaleur?.nom_reseau,
          }}
          captureImageName={fileName}
          export={
            advancedMode
              ? [
                  {
                    columns: [
                      {
                        accessorKey: 'installation',
                        name: `Installation (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P1abo`)})`,
                      },
                      {
                        accessorKey: 'p1Abo',
                        name: `P1 abo (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P1conso`)})`,
                      },
                      {
                        accessorKey: 'p1ConsoChaud',
                        name: `P1 conso chaud (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P1prime`)})`,
                      },
                      {
                        accessorKey: 'p1Prime',
                        name: `P1' (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P1prime`)})`,
                      },
                      {
                        accessorKey: 'p1Ecs',
                        name: `P1 ECS (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P1ECS`)})`,
                      },
                      {
                        accessorKey: 'p1ConsoFroid',
                        name: `P1 conso froid (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P1Consofroid`)})`,
                      },
                      { accessorKey: 'p2', name: `P2 (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P2`)})` },
                      { accessorKey: 'p3', name: `P3 (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P3`)})` },
                      { accessorKey: 'p4', name: `P4 (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P4`)})` },
                      {
                        accessorKey: 'p4MoinsAides',
                        name: `P4 moins aides (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . P4 moins aides`)})`,
                      },
                      {
                        accessorKey: 'aides',
                        name: `Aides (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . aides`)})`,
                      },
                      {
                        accessorKey: 'totalSansAides',
                        name: `Total sans aides (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . total sans aides`)})`,
                      },
                      {
                        accessorKey: 'totalAvecAides',
                        name: `Total avec aides (${engine.getUnit(`Bilan x ${modesDeChauffage[0].coutPublicodeKey} . total avec aides`)})`,
                      },
                    ],
                    data: modesDeChauffage.map((m) => ({
                      aides: engine.getField(`Bilan x ${m.coutPublicodeKey} . aides`),
                      installation: m.label,
                      p1Abo: engine.getField(`Bilan x ${m.coutPublicodeKey} . P1abo`),
                      p1ConsoChaud: engine.getField(`Bilan x ${m.coutPublicodeKey} . P1conso`),
                      p1ConsoFroid: engine.getField(`Bilan x ${m.coutPublicodeKey} . P1Consofroid`),
                      p1Ecs: engine.getField(`Bilan x ${m.coutPublicodeKey} . P1ECS`),
                      p1Prime: engine.getField(`Bilan x ${m.coutPublicodeKey} . P1prime`),
                      p2: engine.getField(`Bilan x ${m.coutPublicodeKey} . P2`),
                      p3: engine.getField(`Bilan x ${m.coutPublicodeKey} . P3`),
                      p4: engine.getField(`Bilan x ${m.coutPublicodeKey} . P4`),
                      p4MoinsAides: engine.getField(`Bilan x ${m.coutPublicodeKey} . P4 moins aides`),
                      totalAvecAides: engine.getField(`Bilan x ${m.coutPublicodeKey} . total avec aides`),
                      totalSansAides: engine.getField(`Bilan x ${m.coutPublicodeKey} . total sans aides`),
                    })),
                    name: 'Coûts par logement - tertiaire',
                  },
                  {
                    columns: [
                      {
                        accessorKey: 'installation',
                        name: `Installation (${engine.getUnit(`Installation x ${modesDeChauffage[0].emissionsCO2PublicodesKey} . besoin d'installation supplémentaire pour produire l'ECS`)})`,
                      },
                      {
                        accessorKey: 'besoinInstallation',
                        name: `Besoin d'installation supplémentaire pour produire l'ECS ?`,
                      },
                      {
                        accessorKey: 'scope1',
                        name: `Scope 1 - Besoin de chauffage et ECS si même équipement (kgCO2 équ.) (${engine.getUnit(`env . Installation x ${modesDeChauffage[0].emissionsCO2PublicodesKey} . besoins de chauffage et ECS si même équipement`)})`,
                      },
                      {
                        accessorKey: 'scope2Auxiliaires',
                        name: `Scope 2 - Auxiliaires et combustible électrique (kgCO2 équ.) (${engine.getUnit(`env . Installation x ${modesDeChauffage[0].emissionsCO2PublicodesKey} . auxiliaires et combustible électrique`)})`,
                      },
                      {
                        accessorKey: 'scope2EcsSolaire',
                        name: `Scope 2 - Ecs solaire thermique (${engine.getUnit(`env . Installation x ${modesDeChauffage[0].emissionsCO2PublicodesKey} . ECS solaire thermique`)})`,
                      },
                      {
                        accessorKey: 'scope2EcsBallon',
                        name: `Scope 2 - Eau chaude sanitaire avec ballon électrique (${engine.getUnit(`env . Installation x ${modesDeChauffage[0].emissionsCO2PublicodesKey} . ECS avec ballon électrique`)})`,
                      },
                      {
                        accessorKey: 'scope2Total',
                        name: `Scope 2 - Total (${engine.getUnit(`env . Installation x ${modesDeChauffage[0].emissionsCO2PublicodesKey} . Scope 2`)})`,
                      },
                      {
                        accessorKey: 'scope3',
                        name: `Scope 3 (${engine.getUnit(`env . Installation x ${modesDeChauffage[0].emissionsCO2PublicodesKey} . Scope 3`)})`,
                      },
                      {
                        accessorKey: 'total',
                        name: `Total des émissions (${engine.getUnit(`env . Installation x ${modesDeChauffage[0].emissionsCO2PublicodesKey} . Total`)})`,
                      },
                    ],
                    data: modesDeChauffage.map((m) => ({
                      besoinInstallation: engine.getField(
                        `Installation x ${m.emissionsCO2PublicodesKey} . besoin d'installation supplémentaire pour produire l'ECS`
                      ),
                      installation: m.label,
                      scope1: engine.getField(
                        `env . Installation x ${m.emissionsCO2PublicodesKey} . besoins de chauffage et ECS si même équipement`
                      ),
                      scope2Auxiliaires: engine.getField(
                        `env . Installation x ${m.emissionsCO2PublicodesKey} . auxiliaires et combustible électrique`
                      ),
                      scope2EcsBallon: engine.getField(`env . Installation x ${m.emissionsCO2PublicodesKey} . ECS avec ballon électrique`),
                      scope2EcsSolaire: engine.getField(`env . Installation x ${m.emissionsCO2PublicodesKey} . ECS solaire thermique`),
                      scope2Total: engine.getField(`env . Installation x ${m.emissionsCO2PublicodesKey} . Scope 2`),
                      scope3: engine.getField(`env . Installation x ${m.emissionsCO2PublicodesKey} . Scope 3`),
                      total: engine.getField(`env . Installation x ${m.emissionsCO2PublicodesKey} . Total`),
                    })),
                    name: 'Emissions de CO2',
                  },
                ]
              : undefined
          }
        />
      ) : (
        <ResultsNotAvailable advancedMode={advancedMode} />
      )}
    </div>
  );

  const addressAutocomplete = (
    <AddressAutocomplete
      excludeCities
      label={
        <Label
          label="Adresse"
          help="Pour le moment, l’adresse est utilisée uniquement pour évaluer la proximité aux réseaux de chaleur et froid et la zone climatique, et non pour récupérer les caractéristiques du bâtiment"
        />
      }
      state={addressError ? 'error' : undefined}
      stateRelatedMessage={
        addressError ? 'Désolé, nous n’avons pas trouvé la ville associée à cette adresse, essayez avec une autre' : undefined
      }
      forceReload={forceReload}
      defaultValue={addressInUrl || userInfo.address || ''}
      onLoadingChange={(loading) => {
        if (loading) {
          setAddressLoading(true);
        }
      }}
      onClear={() => {
        setNearestReseauDeChaleur(undefined);
        setNearestReseauDeFroid(undefined);
        setAddressError(false);
        setAddressLoading(false);
        setUserInfo({ address: '' });
        void setAddressInUrl(null);
        setLngLat(undefined);

        engine.setSituation(
          ObjectEntries(addresseToPublicodesRules).reduce((acc, [key]) => {
            acc[key] = null as any;
            return acc;
          }, engine.getSituation())
        );
      }}
      onSelect={async (selectedAddress) => {
        try {
          setAddressError(false);
          setLngLat(undefined);

          const [lon, lat] = selectedAddress.geometry.coordinates;
          const addressLabel = selectedAddress.properties.label;
          if (addressLabel !== userInfo.address) {
            setUserInfo({ address: '' });
          }
          const isCity = selectedAddress.properties.label === selectedAddress.properties.city;
          const network = isCity
            ? await trpcUtils.client.reseaux.cityNetwork.query({ city: selectedAddress.properties.city })
            : await trpcUtils.client.reseaux.eligibilityStatus.query({
                city: selectedAddress.properties.city,
                lat,
                lon,
              });
          setAddressDetail({
            geoAddress: selectedAddress,
            network,
          });
          trackEvent('Eligibilité|Formulaire de test - Comparateur - Envoi', selectedAddress.properties.label);
          const infos: LocationInfoResponse = await postFetchJSON('/api/location-infos', {
            city: selectedAddress.properties.city,
            cityCode: selectedAddress.properties.citycode,
            lat,
            lon,
          });
          console.info('locations-infos', infos);
          const isEligible =
            infos.nearestReseauDeChaleur &&
            infos.nearestReseauDeChaleur.distance <
              getNetworkEligibilityDistances(infos.nearestReseauDeChaleur['Identifiant reseau']).eligibleDistance;
          trackEvent(
            `Eligibilité|Formulaire de test - Comparateur - Adresse ${isEligible ? 'É' : 'Iné'}ligible`,
            selectedAddress.properties.label
          );

          setNearestReseauDeChaleur(infos.nearestReseauDeChaleur);
          setNearestReseauDeFroid(infos.nearestReseauDeFroid);

          if (!infos.infosVille) {
            setAddressError(true);
            return;
          }

          setUserInfo({ address: addressLabel });
          void setAddressInUrl(addressLabel);

          if (infos.nearestReseauDeChaleur || infos.nearestReseauDeFroid) {
            setLngLat(selectedAddress.geometry.coordinates);
          }

          engine.setSituation(
            ObjectEntries(addresseToPublicodesRules).reduce((acc, [key, infoGetter]) => {
              acc[key] = infoGetter(infos) ?? null;
              return acc;
            }, engine.getSituation())
          );
        } catch (e) {
          setAddressError(true);
          console.error('Error setting address', e);
        } finally {
          setAddressLoading(false);
        }
      }}
    />
  );

  return (
    <>
      <EligibilityFormModal />

      {advancedMode && (
        <Configuration
          engine={engine}
          address={userInfo.address ?? undefined}
          onChangeAddress={(newAddress) => {
            if (newAddress !== userInfo.address) {
              setForceReload(true);
              setUserInfo({ address: newAddress });
              void setAddressInUrl(newAddress);
            }
          }}
        />
      )}
      <div className={cx(fr.cx('fr-container'), className)} {...props}>
        {!advancedMode && (
          <Notice variant="info" size="sm">
            <span className="flex sm:flex-row flex-col gap-2">
              <span>
                Pour comparer d'autres modes de chauffage et de refroidissement, et pouvoir modifier l'ensemble des paramètres de calcul, un
                mode avancé est disponible sur connexion.
              </span>
              <Button
                variant="info"
                className="whitespace-nowrap"
                priority="secondary"
                size="small"
                href={`/pro/comparateur-couts-performances?${searchParams?.toString() ?? ''}`}
              >
                Accéder au mode avancé
              </Button>
            </span>
          </Notice>
        )}
        <FormProvider engine={engine}>
          <Simulator $loading={loading}>
            {advancedMode ? (
              <div className="flex flex-col gap-4">
                <Accordion
                  expanded={selectedTabId === simulatorTabs[0].tabId}
                  onExpandedChange={(expanded) => (expanded ? setSelectedTabId(simulatorTabs[0].tabId) : setSelectedTabId(null))}
                  bordered
                  label={
                    <div>
                      {simulatorTabs[0].label}
                      {userInfo.address && selectedTabId !== simulatorTabs[0].tabId && (
                        <div className={fr.cx('fr-text--xs', 'fr-text--light')}>{userInfo.address}</div>
                      )}
                    </div>
                  }
                >
                  {addressAutocomplete}
                  <ParametresDuBatimentTechnicien engine={engine} />
                  <Button onClick={() => setSelectedTabId(simulatorTabs[1].tabId)} full disabled={!isAddressSelected} className="fr-mt-2w">
                    Étape suivante
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
                  <Button onClick={() => setSelectedTabId(simulatorTabs[2].tabId)} full disabled={!isAddressSelected} className="fr-mt-2w">
                    Étape suivante
                  </Button>
                </Accordion>
                <Accordion
                  expanded={selectedTabId === simulatorTabs[2].tabId}
                  onExpandedChange={(expanded) => (expanded ? setSelectedTabId(simulatorTabs[2].tabId) : setSelectedTabId(null))}
                  disabled={!isAddressSelected}
                  bordered
                  label={simulatorTabs[2].label}
                >
                  <ParametresDesModesDeChauffage engine={engine} />
                </Accordion>
              </div>
            ) : (
              <div className="flex flex-col">
                {addressAutocomplete}
                <ParametresDuBatimentGrandPublic engine={engine} />
              </div>
            )}
            <Results className={addressLoading ? 'opacity-30 animate-pulse' : ''}>{results}</Results>
            <FloatingButton onClick={() => setGraphDrawerOpen(true)} iconId="ri-arrow-up-fill">
              Voir les résultats
            </FloatingButton>
            <Drawer open={graphDrawerOpen} onClose={() => setGraphDrawerOpen(false)} direction="right" full>
              <div className="max-w-full overflow-auto">{results}</div>
            </Drawer>
            {advancedMode && <DebugDrawer engine={engine} />}
          </Simulator>
        </FormProvider>
      </div>
      {!loading && (
        <Section variant="light">
          <SectionHeading size="h3">Une suggestion ou une remarque&nbsp;?</SectionHeading>
          <SectionContent className="flex items-center gap-2">
            <FCUArrowIcon />
            <div className="fr-text--lg mb-0!">Faites nous part de vos retours et suggestions sur ce comparateur</div>
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
