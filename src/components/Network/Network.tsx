import { fr } from '@codegouvfr/react-dsfr';
import { ReactElement } from 'react';

import Map from '@components/Map/Map';
import Accordion from '@components/ui/Accordion';
import Box from '@components/ui/Box';
import Heading from '@components/ui/Heading';
import Link from '@components/ui/Link';
import Text from '@components/ui/Text';
import Tooltip from '@components/ui/Tooltip';
import { isDefined } from '@utils/core';
import { formatMW, formatMWh, prettyFormatNumber } from '@utils/strings';
import { createMapConfiguration } from 'src/services/Map/map-configuration';
import { Network } from 'src/types/Summary/Network';

import ClassedNetwork from './ClassedNetwork';
import ColdNetwork from './ColdNetwork';
import EligibilityTestBox from './EligibilityTestBox';
import EnergiesChart from './EnergiesChart';
import { BoxSection, InformationsComplementairesBox } from './Network.styles';

const getFullURL = (link: string) => {
  return link.startsWith('http://') || link.startsWith('https://') ? link : `https://${link}`;
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
        <Box mb="4w">
          <Heading as="h1" color="blue-france">
            {network.nom_reseau ?? 'Nom inconnu'} ({network['Identifiant reseau']})
          </Heading>
          {network['reseaux classes'] && (
            <Box mt="1w">
              <ClassedNetwork externalLinks={externalLinks} />
            </Box>
          )}
          {isCold && (
            <Box mt="1w">
              <ColdNetwork />
            </Box>
          )}
          <Text mt="1w" size="sm">
            Vous êtes la collectivité ou l’exploitant de ce réseau et vous souhaitez ajouter ou modifier des informations ?
            <Link href={`/reseaux/modifier?reseau=${network['Identifiant reseau']}`} className="fr-ml-1w">
              Cliquez ici
            </Link>
          </Text>
        </Box>
      )}
      <div className="fr-grid-row fr-grid-row--gutters">
        {hasFirstColumn(isCold, displayBlocks) && (
          <Box
            display="flex"
            flexDirection="column"
            gap="16px"
            className={hasSecondColumn(isCold, displayBlocks) ? 'fr-col-12 fr-col-lg-6' : 'fr-col-12'}
          >
            {(!displayBlocks || displayBlocks.includes('performances')) && (
              <Box p="4w" textColor="white" backgroundColor="#4550e5">
                <Heading as="h3" legacyColor="white">
                  Performances environnementales
                </Heading>
                <Text size="sm" fontStyle="italic" mb="2w">
                  Données réglementaires,{' '}
                  <a href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000049925781" target="_blank" rel="noreferrer noopener">
                    arrêté du 5 juillet 2024
                  </a>{' '}
                  portant sur l’année 2022, ou la moyenne des années 2020, 2021 et 2022.
                </Text>
                {!isCold && <Property label="Taux d’EnR&R" value={network['Taux EnR&R']} unit="%" />}
                <Property
                  label="Contenu CO2 ACV"
                  value={network['contenu CO2 ACV']}
                  formatter={formatCO2}
                  tooltip="ACV : en analyse du cycle de vie (émissions directes et indirectes)."
                />
                <Property label="Contenu CO2" value={network['contenu CO2']} formatter={formatCO2} tooltip="Émissions directes" />
              </Box>
            )}

            {(!displayBlocks || displayBlocks.includes('techniques')) && (
              <BoxSection>
                <Heading as="h3" color="blue-france">
                  Caractéristiques techniques
                </Heading>
                <Property
                  label="Année de création du réseau"
                  value={network.annee_creation}
                  formatter={(f) => `${f}`} /* disable number formatting */
                />

                <Text size="sm" fontStyle="italic" underline my="2w">
                  Données pour l'année 2023
                </Text>
                <Property label="Points de livraison" value={network.nb_pdl} />
                <Property
                  label={`Livraisons totales de ${isCold ? 'froid' : 'chaleur'}`}
                  value={network.livraisons_totale_MWh}
                  formatter={formatMWh}
                />
                <Accordion label="Voir le détail par secteur">
                  <Property label="Résidentiel" value={network.livraisons_residentiel_MWh} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="Tertiaire" value={network.livraisons_tertiaire_MWh} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="Agriculture" value={network.livraisons_agriculture_MWh} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="Industrie" value={network.livraisons_industrie_MWh} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="Autres" value={network.livraisons_autre_MWh} formatter={formatMWh} simpleLabel skipEmpty />
                </Accordion>

                <Property
                  label={`Production totale de ${isCold ? 'froid' : 'chaleur'}`}
                  value={network.production_totale_MWh}
                  formatter={formatMWh}
                />
                <Accordion label="Voir le détail par type d’énergie">
                  <Property label="Gaz naturel" value={network.prod_MWh_gaz_naturel} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="Charbon" value={network.prod_MWh_charbon} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property
                    label="Fioul domestique"
                    value={network.prod_MWh_fioul_domestique}
                    formatter={formatMWh}
                    simpleLabel
                    skipEmpty
                  />
                  <Property label="Fioul lourd" value={network.prod_MWh_fioul_lourd} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="GPL" value={network.prod_MWh_GPL} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="Biomasse solide" value={network.prod_MWh_biomasse_solide} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property
                    label="Déchets internes"
                    value={network.prod_MWh_dechets_internes}
                    formatter={formatMWh}
                    simpleLabel
                    skipEmpty
                  />
                  <Property label="UIOM" value={network.prod_MWh_UIOM} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="Biogaz" value={network.prod_MWh_biogaz} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="Géothermie" value={network.prod_MWh_geothermie} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="PAC" value={network.prod_MWh_PAC} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property
                    label="Solaire thermique"
                    value={network.prod_MWh_solaire_thermique}
                    formatter={formatMWh}
                    simpleLabel
                    skipEmpty
                  />
                  <Property
                    label="Chaleur industiel"
                    value={network.prod_MWh_chaleur_industiel}
                    formatter={formatMWh}
                    simpleLabel
                    skipEmpty
                  />
                  <Property
                    label="Autre chaleur récupérée"
                    value={network.prod_MWh_autre_chaleur_recuperee}
                    formatter={formatMWh}
                    simpleLabel
                    skipEmpty
                  />
                  <Property
                    label="Chaudières électriques"
                    value={network.prod_MWh_chaudieres_electriques}
                    formatter={formatMWh}
                    simpleLabel
                    skipEmpty
                  />
                  <Property label="Autres" value={network.prod_MWh_autres} formatter={formatMWh} simpleLabel skipEmpty />
                  <Property label="Autres ENR" value={network.prod_MWh_autres_ENR} formatter={formatMWh} simpleLabel skipEmpty />
                </Accordion>

                <Property label="Puissance totale installée" value={network.puissance_MW_totale} formatter={formatMW} />
                <Accordion label="Voir le détail par type d’énergie">
                  <Property label="Gaz naturel" value={network.puissance_MW_gaz_naturel} formatter={formatMW} simpleLabel skipEmpty />
                  <Property label="Charbon" value={network.puissance_MW_charbon} formatter={formatMW} simpleLabel skipEmpty />
                  <Property
                    label="Fioul domestique"
                    value={network.puissance_MW_fioul_domestique}
                    formatter={formatMW}
                    simpleLabel
                    skipEmpty
                  />
                  <Property label="Fioul lourd" value={network.puissance_MW_fioul_lourd} formatter={formatMW} simpleLabel skipEmpty />
                  <Property label="GPL" value={network.puissance_MW_GPL} formatter={formatMW} simpleLabel skipEmpty />
                  <Property
                    label="Biomasse solide"
                    value={network.puissance_MW_biomasse_solide}
                    formatter={formatMW}
                    simpleLabel
                    skipEmpty
                  />
                  <Property
                    label="Déchets internes"
                    value={network.puissance_MW_dechets_internes}
                    formatter={formatMW}
                    simpleLabel
                    skipEmpty
                  />
                  <Property label="UIOM" value={network.puissance_MW_UIOM} formatter={formatMW} simpleLabel skipEmpty />
                  <Property label="Biogaz" value={network.puissance_MW_biogaz} formatter={formatMW} simpleLabel skipEmpty />
                  <Property label="Géothermie" value={network.puissance_MW_geothermie} formatter={formatMW} simpleLabel skipEmpty />
                  <Property label="PAC" value={network.puissance_MW_PAC} formatter={formatMW} simpleLabel skipEmpty />
                  <Property
                    label="Solaire thermique"
                    value={network.puissance_MW_solaire_thermique}
                    formatter={formatMW}
                    simpleLabel
                    skipEmpty
                  />
                  <Property
                    label="Chaleur industiel"
                    value={network.puissance_MW_chaleur_industiel}
                    formatter={formatMW}
                    simpleLabel
                    skipEmpty
                  />
                  <Property
                    label="Autre chaleur récupérée"
                    value={network.puissance_MW_autre_chaleur_recuperee}
                    formatter={formatMW}
                    simpleLabel
                    skipEmpty
                  />
                  <Property
                    label="Chaudières électriques"
                    value={network.puissance_MW_chaudieres_electriques}
                    formatter={formatMW}
                    simpleLabel
                    skipEmpty
                  />
                  <Property label="Autres" value={network.puissance_MW_autres} formatter={formatMW} simpleLabel skipEmpty />
                  <Property label="Autres ENR" value={network.puissance_MW_autres_ENR} formatter={formatMW} simpleLabel skipEmpty />
                </Accordion>

                <Property label="Contenu CO2 (non réglementaire)" value={network.contenu_CO2_2023_tmp} formatter={formatCO2} />
                <Property label="Contenu CO2 ACV (non réglementaire)" value={network.contenu_CO2_ACV_2023_tmp} formatter={formatCO2} />

                <Text size="sm" fontStyle="italic" my="2w">
                  <Text as="span" underline>
                    Données pour l'année 2022
                  </Text>
                  &nbsp;(en attente de la diffusion par la FEDENE des données 2023)
                </Text>

                <Property
                  label="Rendement"
                  value={network['Rend%']}
                  round
                  unit="%"
                  tooltip="Rapport entre l'énergie thermique livrée aux abonnés l'énergie thermique injectée dans le réseau."
                />
                {!isCold && (
                  <Property
                    label="Développement du réseau"
                    value={network['Dev_reseau%']}
                    unit="%"
                    tooltip="Ratio entre le nombre de nouveaux abonnés en 2022 et le nombre total d'abonnés en 2021."
                  />
                )}

                <Text size="sm" fontStyle="italic" my="2w">
                  <Text as="span" underline>
                    Données pour l'année 2021
                  </Text>
                  &nbsp;(ces données ne sont plus actualisées avec le même niveau de précision)
                </Text>
                <Property label={`Longueur du réseau${!isCold ? ' (aller)' : ''}`} value={network.longueur_reseau} unit="km" />
                {!isCold && (
                  <>
                    <Property label="Fluide caloporteur - eau chaude" value={network.eau_chaude} formatter={numberBooleanFormatter} />
                    <Property
                      label="Fluide caloporteur - eau surchauffée"
                      value={network.eau_surchauffee}
                      formatter={numberBooleanFormatter}
                    />
                    <Property label="Fluide caloporteur - vapeur" value={network.vapeur} formatter={numberBooleanFormatter} />
                  </>
                )}
              </BoxSection>
            )}

            {!isCold && (!displayBlocks || displayBlocks.includes('tarifs')) && (
              <BoxSection>
                <Heading as="h3" color="blue-france">
                  Informations tarifaires
                  <Tooltip
                    title="La comparaison avec le prix des autres énergies n’est pertinente qu’en coût global annuel, en intégrant les coûts
                    d’exploitation, de maintenance et d’investissement, amortis sur la durée de vie des installations."
                    iconProps={{ size: 'sm', className: 'fr-ml-1w' }}
                  />
                </Heading>

                <Text fontStyle="italic" mb="2w">
                  <Text as="span" underline>
                    Données pour l'année 2022
                  </Text>
                  &nbsp;(en attente de la diffusion par la FEDENE des données 2023)
                </Text>
                {network.PM || network.PM_L || network.PM_T || network['PV%'] || network['PF%'] ? (
                  <>
                    {isDefined(network.PM) && <Property label="Prix moyen de la chaleur" value={network.PM} unit="€TTC/MWh" round />}
                    {(isDefined(network.PM_L) || isDefined(network.PM_T)) && (
                      <>
                        <br />
                        <b>Prix moyen par catégorie d'abonnés</b>
                        {isDefined(network.PM_L) && (
                          <Property
                            label={<Box ml="2w">Logements</Box>}
                            value={network.PM_L}
                            unit="€TTC/MWh"
                            round
                            tooltip="Prix moyen pour une copropriété de 30 lots avec une consommation de 300 MWh/an"
                          />
                        )}
                        {isDefined(network.PM_T) && (
                          <Property
                            label={<Box ml="2w">Tertiaire</Box>}
                            value={network.PM_T}
                            unit="€TTC/MWh"
                            round
                            tooltip="Prix moyen pour une surface de 1000m² avec une consommation de 1500 MWh/an"
                          />
                        )}
                      </>
                    )}
                    {(isDefined(network['PV%']) || isDefined(network['PF%'])) && (
                      <>
                        <br />
                        <b>Poids respectifs des parts fixe et variable</b>
                        {isDefined(network['PV%']) && (
                          <Property
                            label={<Box ml="2w">% de la part variable (fonction des consommations)</Box>}
                            value={network['PV%']}
                            unit="%"
                          />
                        )}
                        {isDefined(network['PF%']) && (
                          <Property label={<Box ml="2w">% de la part fixe (abonnement)</Box>} value={network['PF%']} unit="%" />
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div>Ces informations ne sont pas disponibles pour le moment.</div>
                )}
              </BoxSection>
            )}

            {(!displayBlocks || displayBlocks.includes('contacts')) && (
              <BoxSection>
                <Heading as="h3" color="blue-france">
                  Contacts
                </Heading>
                <Property label="Maître d'Ouvrage" value={network.MO} />
                <Box display="flex" justifyContent="space-between">
                  <Box display="flex">
                    <strong>Adresse</strong>
                  </Box>
                  <Box textAlign="right">
                    {isDefined(network.adresse_mo) ? (
                      <>
                        {network.adresse_mo}
                        <br />
                      </>
                    ) : (
                      ''
                    )}
                    {isDefined(network.CP_MO) ? network.CP_MO : ''} {isDefined(network.ville_mo) ? network.ville_mo : ''}
                  </Box>
                </Box>

                <br />
                <Property label="Gestionnaire" value={network.Gestionnaire} />
                <Property
                  label="Site Internet"
                  value={network.website_gestionnaire}
                  formatter={(url) => (
                    <Link href={getFullURL(url)} isExternal>
                      {url}
                    </Link>
                  )}
                />
              </BoxSection>
            )}
          </Box>
        )}

        {hasSecondColumn(isCold, displayBlocks) && (
          <Box
            display="flex"
            flexDirection="column"
            gap="16px"
            className={hasFirstColumn(isCold, displayBlocks) ? 'fr-col-12 fr-col-lg-6' : 'fr-col-12'}
          >
            {(!displayBlocks || displayBlocks.includes('formulaire_eligibilite')) && !isCold && network.has_trace && (
              <EligibilityTestBox networkId={network['Identifiant reseau']} />
            )}

            {(!displayBlocks || displayBlocks.includes('informations')) && network.informationsComplementaires && (
              <InformationsComplementairesBox>
                <Heading as="h3" color="blue-france">
                  Informations complémentaires
                </Heading>
                {network.informationsComplementaires
                  .split('\n')
                  .map((line, index) => (line === '' ? <br key={index} /> : <Text key={index}>{line}</Text>))}
                {network.fichiers.length > 0 && (
                  <Box mt="2w">
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
                  </Box>
                )}
                <Text size="sm" legacyColor="lightgrey" fontStyle="italic" mt="4w">
                  Informations fournies par la collectivité ou l’exploitant
                </Text>
              </InformationsComplementairesBox>
            )}

            {!isCold && (!displayBlocks || displayBlocks.includes('energies')) && (
              <BoxSection>
                <Heading as="h3" color="blue-france">
                  Mix énergétique
                </Heading>
                <EnergiesChart network={network} />
              </BoxSection>
            )}

            {(!displayBlocks || displayBlocks.includes('map')) && (
              <Box height="655px">
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
              </Box>
            )}
          </Box>
        )}
      </div>

      {(!displayBlocks || displayBlocks.includes('sources')) && (
        <Box mt="4w" className={fr.cx('fr-hint-text')}>
          <Box>
            Sources : L’ensemble des données sont extraites des enquêtes réalisées par la Fedene Réseaux de chaleur et de froid avec le
            concours de l’association AMORCE, sous tutelle du service des données et études statistiques (SDES) du ministère de la
            transition écologique.
          </Box>
          <ul>
            <li>
              Données 2023 :{' '}
              <Link
                href="https://www.statistiques.developpement-durable.gouv.fr/catalogue?page=datafile&datafileRid=5f93b3f9-8d0f-414c-ad35-51db742c421c"
                isExternal
              >
                données locales de l’énergie diffusées par le SDES
              </Link>
            </li>
            <li>
              Données 2022 :{' '}
              <Link href="https://fedene.fr/ressource/bibliotheque-de-donnees-des-reseaux-de-chaleur-et-de-froid-2023/" isExternal>
                bibliothèque de données de la Fedene Réseaux de chaleur et de froid
              </Link>
            </li>
            <li>Données 2021 : ViaSeva.</li>
          </ul>

          <img src="/logo-fedene.svg" alt="logo fedene" height="50px" className="fr-mr-2w" />
          <img src="/logo-amorce.svg" alt="logo amorce" height="50px" />
        </Box>
      )}
    </>
  );
};

export default NetworkPanel;

interface PropertyProps<T> {
  label: string | ReactElement;
  value: T | undefined;
  unit?: string; // overridden by the formatter if present
  round?: boolean;
  formatter?: (value: T) => string | ReactElement;
  tooltip?: string | ReactElement;
  simpleLabel?: boolean;
  skipEmpty?: boolean;
}
const Property = <T,>({ label, value, unit, formatter, tooltip, round, simpleLabel, skipEmpty }: PropertyProps<T>) =>
  ((skipEmpty && isDefined(value) && value !== 0) || !skipEmpty) && (
    <Box display="flex" justifyContent="space-between">
      <Box display="flex">
        {typeof label === 'string' ? simpleLabel ? label : <strong>{label}</strong> : label}
        {tooltip && (
          <Tooltip
            title={tooltip}
            iconProps={{
              className: 'fr-ml-1w',
            }}
          />
        )}
      </Box>
      <div>
        {isDefined(value)
          ? isDefined(formatter)
            ? formatter(value)
            : `${typeof value === 'number' ? prettyFormatNumber(value, round ? 0 : undefined) : value} ${unit ?? ''}`
          : 'Non connu'}
      </div>
    </Box>
  );

function numberBooleanFormatter(value: string): string | ReactElement {
  return !isNaN(Number.parseFloat(value)) ? `${Math.round(Number.parseFloat(value))} %` : value.toLowerCase() === 'oui' ? 'Oui' : 'Non';
}

function formatCO2(co2kg: number): string {
  return `${Math.round(co2kg * 1000)} g CO2/kWh`;
}
