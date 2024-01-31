import HoverableIcon from '@components/Hoverable/HoverableIcon';
import Map from '@components/Map/Map';
import { getConso } from 'src/services/Map/conso';
import { Network } from 'src/types/Summary/Network';
import ClassedNetwork from './ClassedNetwork';
import ColdNetwork from './ColdNetwork';
import {
  AddressContent,
  BlueBox,
  Box,
  BoxContent,
  BoxIcon,
  Colmun,
  InformationsComplementairesBox,
  MapContainer,
  Title,
} from './Network.styles';
import EnergiesChart from './EnergiesChart';
import Text from '@components/ui/Text';
import Link from 'next/link';

const getFullURL = (link: string) => {
  return link.startsWith('http://') || link.startsWith('https://')
    ? link
    : `https://${link}`;
};

const hasFirstColumn = (isCold: boolean, displayBlocks?: string[]) => {
  return (
    !displayBlocks ||
    displayBlocks.includes('performances') ||
    displayBlocks.includes('techniques') ||
    (!isCold && displayBlocks.includes('tarifs')) ||
    displayBlocks.includes('contacts')
  );
};

const hasSecondColumn = (isCold: boolean, displayBlocks?: string[]) => {
  return (
    !displayBlocks ||
    displayBlocks.includes('map') ||
    (!isCold && displayBlocks.includes('energies'))
  );
};

const Network = ({
  network,
  displayBlocks,
  externalLinks,
}: {
  network: Network;
  displayBlocks?: string[];
  externalLinks?: boolean;
}) => {
  const isCold = network['Identifiant reseau'].includes('F');
  return (
    <>
      {(!displayBlocks || displayBlocks.includes('titre')) && (
        <div className="fr-mb-4w">
          <Title>
            {network.nom_reseau ?? 'Nom inconnu'} (
            {network['Identifiant reseau']})
          </Title>
          {network['reseaux classes'] && (
            <div className="fr-mt-1w">
              <ClassedNetwork externalLinks={externalLinks} />
            </div>
          )}
          {isCold && (
            <div className="fr-mt-1w">
              <ColdNetwork />
            </div>
          )}
          <Text mt="1w" legacyColor="lightblue" size="sm">
            Vous êtes la collectivité ou l’exploitant de ce réseau et vous
            souhaitez ajouter ou modifier des informations ?
            <Link
              href={`/reseaux/modifier?reseau=${network['Identifiant reseau']}`}
              className="fr-ml-1w"
            >
              Cliquez ici
            </Link>
          </Text>
        </div>
      )}
      <div className="fr-grid-row fr-grid-row--gutters">
        {hasFirstColumn(isCold, displayBlocks) && (
          <Colmun
            className={
              hasSecondColumn(isCold, displayBlocks)
                ? 'fr-col-12 fr-col-lg-6'
                : 'fr-col-12'
            }
          >
            {(!displayBlocks || displayBlocks.includes('performances')) && (
              <BlueBox>
                <h3>Performances environnementales</h3>
                {!isCold && (
                  <BoxContent>
                    <div>
                      <b>Taux d’EnR&R</b>
                    </div>
                    <div>
                      {network['Taux EnR&R'] !== null &&
                      network['Taux EnR&R'] !== undefined
                        ? `${network['Taux EnR&R']}%`
                        : 'Non connu'}
                    </div>
                  </BoxContent>
                )}
                <BoxContent>
                  <div>
                    <b>Contenu CO2 ACV</b>
                    <HoverableIcon
                      iconName="ri-information-fill"
                      position="bottom-centered"
                    >
                      ACV : en analyse du cycle de vie (émissions directes et
                      indirectes).
                    </HoverableIcon>
                  </div>
                  <div>
                    {network['contenu CO2 ACV']
                      ? `${network['contenu CO2 ACV'] * 1000} g CO2/kWh`
                      : 'Non connu'}
                  </div>
                </BoxContent>
              </BlueBox>
            )}
            {(!displayBlocks || displayBlocks.includes('techniques')) && (
              <Box>
                <h3>Caractéristiques techniques</h3>
                <BoxContent>
                  <div>
                    <b>Livraisons totales de {isCold ? 'froid' : 'chaleur'}</b>
                  </div>
                  <div>{getConso(network.livraisons_totale_MWh)}</div>
                </BoxContent>
                <BoxContent>
                  <div className="fr-ml-2w">dont résidentiel</div>
                  <div>{getConso(network.livraisons_residentiel_MWh)}</div>
                </BoxContent>
                <BoxContent>
                  <div className="fr-ml-2w">dont tertiaire</div>
                  <div>{getConso(network.livraisons_tertiaire_MWh)}</div>
                </BoxContent>
                <BoxContent>
                  <div>
                    <b>Points de livraison</b>
                  </div>
                  <div>{network.nb_pdl}</div>
                </BoxContent>
                <BoxContent>
                  <div>
                    <b>Longueur réseau</b>
                  </div>
                  <div>{network.longueur_reseau} km</div>
                </BoxContent>
                {!isCold && (
                  <BoxContent>
                    <div>
                      <BoxIcon>
                        <span>
                          <b>Rendement</b>
                        </span>
                        <HoverableIcon
                          iconName="ri-information-fill"
                          position="bottom-centered"
                        >
                          Rapport entre l'énergie thermique livrée aux abonnés
                          et l'énergie thermique injectée dans le réseau.
                        </HoverableIcon>
                      </BoxIcon>
                    </div>
                    <div>
                      {network['Rend%'] === null
                        ? 'Non connu'
                        : `${network['Rend%']} %`}
                    </div>
                  </BoxContent>
                )}
                <br />
                <BoxContent>
                  <div>
                    <b>Année de création du réseau</b>
                  </div>
                  <div>{network.annee_creation}</div>
                </BoxContent>
                {!isCold && (
                  <>
                    <BoxContent>
                      <div>
                        <b>Fluide caloporteur - eau chaude</b>
                      </div>
                      <div>
                        {network['%_fluide_caloporteur_eau_chaude']
                          ? Math.round(
                              network['%_fluide_caloporteur_eau_chaude']
                            )
                          : '0'}
                         %
                      </div>
                    </BoxContent>
                    <BoxContent>
                      <div>
                        <b>Fluide caloporteur - eau surchauffée</b>
                      </div>
                      <div>
                        {network['%_fluide_caloporteur_eau_surchauffee']
                          ? Math.round(
                              network['%_fluide_caloporteur_eau_surchauffee']
                            )
                          : '0'}
                         %
                      </div>
                    </BoxContent>
                    <BoxContent>
                      <div>
                        <b>Fluide caloporteur - vapeur</b>
                      </div>
                      <div>
                        {network['%_fluide_caloporteur_vapeur']
                          ? Math.round(network['%_fluide_caloporteur_vapeur'])
                          : '0'}
                         %
                      </div>
                    </BoxContent>
                  </>
                )}
              </Box>
            )}
            {!isCold &&
              (!displayBlocks || displayBlocks.includes('tarifs')) && (
                <Box>
                  <BoxIcon>
                    <span>
                      <h3>Informations tarifaires</h3>
                    </span>
                    <HoverableIcon
                      iconSize="lg"
                      iconName="ri-information-fill"
                      position="top-centered"
                    >
                      La comparaison avec le prix des autres énergies n’est
                      pertinente qu’en coût global annuel, en intégrant les
                      coûts d’exploitation, de maintenance et d’investissement,
                      amortis sur la durée de vie des installations.
                    </HoverableIcon>
                  </BoxIcon>
                  {network.PM ||
                  network.PM_L ||
                  network.PM_T ||
                  network['PV%'] ||
                  network['PF%'] ? (
                    <>
                      {network.PM && (
                        <>
                          <BoxContent>
                            <div>
                              <b>Prix moyen de la chaleur (2021)</b>
                            </div>
                            <div>{Math.round(network.PM)} €TTC/MWh</div>
                          </BoxContent>
                          <br />
                        </>
                      )}
                      {(network.PM_L || network.PM_T) && (
                        <>
                          <div>
                            <b>Prix moyen par catégorie d'abonnés (2021)</b>
                          </div>
                          {network.PM_L && (
                            <BoxContent>
                              <div className="fr-ml-2w">
                                <span>Logements</span>
                                <HoverableIcon
                                  iconName="ri-information-fill"
                                  position="bottom-centered"
                                >
                                  Prix moyen pour une copropriété de 30 lots
                                  avec une consommation de 300 MWh/an
                                </HoverableIcon>
                              </div>
                              <div>{Math.round(network.PM_L)} €TTC/MWh</div>
                            </BoxContent>
                          )}
                          {network.PM_T && (
                            <BoxContent>
                              <div className="fr-ml-2w">
                                <span>Tertiaire</span>
                                <HoverableIcon
                                  iconName="ri-information-fill"
                                  position="bottom-centered"
                                >
                                  Prix moyen pour une surface de 1000m² avec une
                                  consommation de 1500 MWh/an
                                </HoverableIcon>
                              </div>
                              <div>{Math.round(network.PM_T)} €TTC/MWh</div>
                            </BoxContent>
                          )}
                          <br />
                        </>
                      )}
                      {(network['PV%'] || network['PF%']) && (
                        <>
                          <div>
                            <b>Poids respectifs des parts fixe et variable</b>
                          </div>
                          {network['PV%'] && (
                            <BoxContent>
                              <div className="fr-ml-2w">
                                % de la part variable (fonction des
                                consommations)
                              </div>
                              <div>{network['PV%']}%</div>
                            </BoxContent>
                          )}
                          {network['PF%'] && (
                            <BoxContent>
                              <div className="fr-ml-2w">
                                {' '}
                                % de la part fixe (abonnement)
                              </div>
                              <div>{network['PF%']}%</div>
                            </BoxContent>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <div>
                      Ces informations ne sont pas disponibles pour le moment.
                    </div>
                  )}
                </Box>
              )}
            {(!displayBlocks || displayBlocks.includes('contacts')) && (
              <Box>
                <h3>Contacts</h3>
                <BoxContent>
                  <div>
                    <b>Maître d'Ouvrage</b>
                  </div>
                  <div>{network.MO}</div>
                </BoxContent>
                <BoxContent>
                  <div>
                    <b>Adresse</b>
                  </div>
                  <AddressContent>
                    {network.adresse_mo && network.adresse_mo !== '0' && (
                      <>
                        {network.adresse_mo}
                        <br />
                      </>
                    )}
                    {network.CP_MO &&
                      network.CP_MO !== '0' &&
                      network.CP_MO !== '00000' &&
                      network.CP_MO}{' '}
                    {network.ville_mo &&
                      network.ville_mo !== '0' &&
                      network.ville_mo}
                  </AddressContent>
                </BoxContent>
                <br />
                <BoxContent>
                  <div>
                    <b>Gestionnaire</b>
                  </div>
                  <div>{network.Gestionnaire}</div>
                </BoxContent>
                <BoxContent>
                  <div>
                    <b>Adresse</b>
                  </div>
                  <AddressContent>
                    {network.adresse_gestionnaire &&
                      network.adresse_gestionnaire !== '0' && (
                        <>
                          {network.adresse_gestionnaire}
                          <br />
                        </>
                      )}
                    {network.CP_gestionnaire &&
                      network.CP_gestionnaire !== '0' &&
                      network.CP_gestionnaire !== '00000' &&
                      network.CP_gestionnaire}{' '}
                    {network.ville_gestionnaire &&
                      network.ville_gestionnaire !== '0' &&
                      network.ville_gestionnaire}
                  </AddressContent>
                </BoxContent>
                {network.website_gestionnaire &&
                  network.website_gestionnaire.trim() !== 'NON' && (
                    <BoxContent>
                      <div>
                        <b>Site Internet</b>
                      </div>
                      <div>
                        <a
                          href={getFullURL(network.website_gestionnaire)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {network.website_gestionnaire}
                        </a>
                      </div>
                    </BoxContent>
                  )}
              </Box>
            )}
          </Colmun>
        )}
        {hasSecondColumn(isCold, displayBlocks) && (
          <Colmun
            className={
              hasFirstColumn(isCold, displayBlocks)
                ? 'fr-col-12 fr-col-lg-6'
                : 'fr-col-12'
            }
          >
            {network.informationsComplementaires && (
              <InformationsComplementairesBox>
                <h3>Informations complémentaires</h3>
                {network.informationsComplementaires
                  .split('\n')
                  .map((line, index) =>
                    line === '' ? (
                      <br key={index} />
                    ) : (
                      <Text key={index}>{line}</Text>
                    )
                  )}
                {network.fichiers.length > 0 && (
                  <div className="fr-mt-2w">
                    {network.fichiers.map((fichier, index) => (
                      <Link
                        key={index}
                        href={`/api/networks/${network['Identifiant reseau']}/files/${fichier.id}`}
                        className="fr-mr-1w"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {fichier.filename}
                      </Link>
                    ))}
                  </div>
                )}
                <Text
                  size="sm"
                  legacyColor="lightgrey"
                  fontStyle="italic"
                  mt="4w"
                >
                  Informations fournies par la collectivité ou l’exploitant
                </Text>
              </InformationsComplementairesBox>
            )}
            {!isCold &&
              (!displayBlocks || displayBlocks.includes('energies')) && (
                <Box>
                  <h3>Mix énergétique</h3>
                  <EnergiesChart network={network} />
                </Box>
              )}
            {(!displayBlocks || displayBlocks.includes('map')) && (
              <MapContainer>
                <Map
                  noPopup
                  center={[network.lon, network.lat]}
                  initialZoom={13}
                  initialLayerDisplay={{
                    outline: true,
                    futurOutline: false,
                    coldOutline: true,
                    zoneDP: false,
                    demands: false,
                    raccordements: false,
                    gasUsageGroup: false,
                    buildings: false,
                    gasUsage: [],
                    energy: [],
                    gasUsageValues: [1000, Number.MAX_VALUE],
                    energyGasValues: [50, Number.MAX_VALUE],
                    energyFuelValues: [50, Number.MAX_VALUE],
                  }}
                />
              </MapContainer>
            )}
          </Colmun>
        )}
      </div>
      {(!displayBlocks || displayBlocks.includes('sources')) && (
        <p className="fr-mt-4w fr-hint-text">
          {network.Gestionnaire &&
          network.Gestionnaire.toLowerCase().includes('engie') ? (
            'Sources : ENGIE Solutions / Enquête annuelle des réseaux de chaleur et de froid, édition 2022 pour l’année 2021, SNCU'
          ) : (
            <>
              Sources : Annuaire Via Sèva /{' '}
              <a
                href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047329716"
                target="_blank"
                rel="noreferrer"
              >
                Arrêté du 16 mars 2023 (DPE)
              </a>{' '}
              / Enquête annuelle des réseaux de chaleur et de froid, édition
              2022 pour l’année 2021, SNCU / Données locales de l’énergie pour
              l’année 2021, SDES <br />
              <img src="/logo-viaseva.svg" alt="logo viaseva" height="75px" />
            </>
          )}
        </p>
      )}
    </>
  );
};

export default Network;
