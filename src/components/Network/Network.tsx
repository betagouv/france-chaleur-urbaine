import HoverableIcon from '@components/Hoverable/HoverableIcon';
import Map from '@components/Map/Map';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import { getConso } from 'src/services/Map/conso';
import { createMapConfiguration } from 'src/services/Map/map-configuration';
import { Network } from 'src/types/Summary/Network';
import ClassedNetwork from './ClassedNetwork';
import ColdNetwork from './ColdNetwork';
import EligibilityTestBox from './EligibilityTestBox';
import EnergiesChart from './EnergiesChart';
import {
  AddressContent,
  BlueBox,
  BoxContent,
  BoxIcon,
  BoxSection,
  Colmun,
  InformationsComplementairesBox,
  MapContainer,
  Title,
} from './Network.styles';

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
    displayBlocks.includes('formulaire_eligibilite') ||
    displayBlocks.includes('informations') ||
    displayBlocks.includes('map') ||
    (!isCold && displayBlocks.includes('energies'))
  );
};

const NetworkPanel = ({
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
              <BoxSection>
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
                  <div>{network.nb_pdl ? network.nb_pdl : 'Non connu'}</div>
                </BoxContent>
                <BoxContent>
                  <div>
                    <b>
                      Longueur réseau
                      {!isCold && ' (aller)'}
                    </b>
                  </div>
                  <div>
                    {network.longueur_reseau
                      ? `${network.longueur_reseau} km`
                      : 'Non connu'}
                  </div>
                </BoxContent>
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
                        l'énergie thermique injectée dans le réseau.
                      </HoverableIcon>
                    </BoxIcon>
                  </div>
                  <div>
                    {network['Rend%'] === null
                      ? 'Non connu'
                      : `${Math.round(Number(network['Rend%']))} %`}
                  </div>
                </BoxContent>
                {!isCold && (
                  <BoxContent>
                    <div>
                      <BoxIcon>
                        <span>
                          <b>Développement du réseau</b>
                        </span>
                        <HoverableIcon
                          iconName="ri-information-fill"
                          position="bottom-centered"
                        >
                          Ratio entre le nombre de nouveaux abonnés en 2022 et
                          le nombre total d'abonnés en 2021
                        </HoverableIcon>
                      </BoxIcon>
                    </div>
                    <div>
                      {network['Dev_reseau%'] === null
                        ? 'Non connu'
                        : `${network['Dev_reseau%']} %`}
                    </div>
                  </BoxContent>
                )}
                <br />
                <BoxContent>
                  <div>
                    <b>Année de création du réseau</b>
                  </div>
                  <div>
                    {network.annee_creation
                      ? network.annee_creation
                      : 'Non connu'}
                  </div>
                </BoxContent>
                {!isCold && (
                  <>
                    <BoxContent>
                      <div>
                        <b>Fluide caloporteur - eau chaude</b>
                      </div>
                      <div>
                        {network['eau_chaude'] === null
                          ? 'Non connu'
                          : !isNaN(Number.parseFloat(network['eau_chaude']))
                          ? `${Math.round(
                              Number.parseFloat(network['eau_chaude'])
                            )} %`
                          : `${network['eau_chaude']}`.toLowerCase() === 'oui'
                          ? 'Oui'
                          : 'Non'}
                      </div>
                    </BoxContent>
                    <BoxContent>
                      <div>
                        <b>Fluide caloporteur - eau surchauffée</b>
                      </div>
                      <div>
                        {network['eau_surchauffee'] === null
                          ? 'Non connu'
                          : !isNaN(
                              Number.parseFloat(network['eau_surchauffee'])
                            )
                          ? `${Math.round(
                              Number.parseFloat(network['eau_surchauffee'])
                            )} %`
                          : `${network['eau_surchauffee']}`.toLowerCase() ===
                            'oui'
                          ? 'Oui'
                          : 'Non'}
                      </div>
                    </BoxContent>
                    <BoxContent>
                      <div>
                        <b>Fluide caloporteur - vapeur</b>
                      </div>
                      <div>
                        {network['vapeur'] === null
                          ? 'Non connu'
                          : !isNaN(Number.parseFloat(network['vapeur']))
                          ? `${Math.round(
                              Number.parseFloat(network['vapeur'])
                            )} %`
                          : `${network['vapeur']}`.toLowerCase() === 'oui'
                          ? 'Oui'
                          : 'Non'}
                      </div>
                    </BoxContent>
                  </>
                )}
              </BoxSection>
            )}
            {!isCold &&
              (!displayBlocks || displayBlocks.includes('tarifs')) && (
                <BoxSection>
                  <BoxIcon>
                    <span>
                      <h3>
                        Informations tarifaires
                        <HoverableIcon
                          iconSize="lg"
                          iconName="ri-information-fill"
                          position="top-centered"
                        >
                          La comparaison avec le prix des autres énergies n’est
                          pertinente qu’en coût global annuel, en intégrant les
                          coûts d’exploitation, de maintenance et
                          d’investissement, amortis sur la durée de vie des
                          installations.
                        </HoverableIcon>
                      </h3>
                    </span>
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
                              <b>Prix moyen de la chaleur</b>
                            </div>
                            <div>{Math.round(network.PM)} €TTC/MWh</div>
                          </BoxContent>
                          <br />
                        </>
                      )}
                      {(network.PM_L || network.PM_T) && (
                        <>
                          <div>
                            <b>Prix moyen par catégorie d'abonnés</b>
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
                </BoxSection>
              )}
            {(!displayBlocks || displayBlocks.includes('contacts')) && (
              <BoxSection>
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
              </BoxSection>
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
            {(!displayBlocks ||
              displayBlocks.includes('formulaire_eligibilite')) &&
              !isCold &&
              network.has_trace && (
                <EligibilityTestBox networkId={network['Identifiant reseau']} />
              )}

            {(!displayBlocks || displayBlocks.includes('informations')) &&
              network.informationsComplementaires && (
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
                          isExternal
                          eventKey="Téléchargement|Schéma directeur"
                          eventPayload={`${network['Identifiant reseau']},${fichier.filename}`}
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
                <BoxSection>
                  <h3>Mix énergétique</h3>
                  <EnergiesChart network={network} />
                </BoxSection>
              )}
            {(!displayBlocks || displayBlocks.includes('map')) && (
              <MapContainer>
                <Map
                  noPopup
                  initialCenter={[network.lon, network.lat]}
                  initialZoom={13}
                  initialMapConfiguration={createMapConfiguration({
                    reseauxDeChaleur: {
                      show: true,
                    },
                    filtreIdentifiantReseau: [network['Identifiant reseau']],
                    reseauxDeFroid: true,
                  })}
                />
              </MapContainer>
            )}
          </Colmun>
        )}
      </div>
      {(!displayBlocks || displayBlocks.includes('sources')) && (
        <p className="fr-mt-4w fr-hint-text">
          <>
            Sources : Enquête annuelle des réseaux de chaleur et de froid
            (EARCF), édition 2023 portant sur l’année 2022, réalisée par la
            Fedene Réseaux de chaleur et de froid avec le concours de
            l’association AMORCE, sous tutelle du service des données et études
            statistiques (SDES) du ministère de la transition écologique.
            {!isCold ? (
              <>
                <br />
                Excepté pour les éléments suivants :
                <ul>
                  <li>
                    "Performances environnementales" : la source est l'
                    <a
                      href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000047329716"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Arrêté du 16 mars 2023
                    </a>{' '}
                    (DPE) réalisé sur la base des données portant sur l'année
                    2021 ou sur une moyenne 2019-2020-2021 (en attente de
                    parution du nouvel arrêté)
                  </li>
                  <li>
                    le fluide caloporteur pour les réseaux utilisant différents
                    types de fluides, et la longueur des réseaux : la source est
                    l'EARCF portant sur l'année 2021 (France Chaleur Urbaine ne
                    disposant pas de données du même niveau de précision sur
                    2022)
                  </li>
                </ul>
              </>
            ) : (
              <>
                {' '}
                Excepté pour les “Performances environnementales" : la source
                est l'Arrêté du 16 mars 2023 (DPE) réalisé sur la base des
                données données portant sur l'année 2021 ou sur une moyenne
                2019-2020-2021 (en attente de parution du nouvel arrêté).
                <br />
                <br />
              </>
            )}
            <img
              src="/logo-fedene.svg"
              alt="logo fedene"
              height="50px"
              className="fr-mr-2w"
            />
            <img src="/logo-amorce.svg" alt="logo amorce" height="50px" />
          </>
        </p>
      )}
    </>
  );
};

export default NetworkPanel;
