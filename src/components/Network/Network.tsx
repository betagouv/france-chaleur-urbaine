import { fr } from '@codegouvfr/react-dsfr';
import { type ReactElement } from 'react';

import Map from '@/components/Map/Map';
import { createMapConfiguration } from '@/components/Map/map-configuration';
import Accordion from '@/components/ui/Accordion';
import Box, { type BoxProps } from '@/components/ui/Box';
import Heading from '@/components/ui/Heading';
import Icon from '@/components/ui/Icon';
import Link from '@/components/ui/Link';
import Text from '@/components/ui/Text';
import Tooltip from '@/components/ui/Tooltip';
import { type Network } from '@/types/Summary/Network';
import { isDefined } from '@/utils/core';
import { formatMW, formatMWh, prettyFormatNumber } from '@/utils/strings';

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
            Vous êtes le maître d’ouvrage ou l’exploitant de ce réseau et vous souhaitez ajouter ou modifier des informations ?
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
                  <a href="https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051520810" target="_blank" rel="noreferrer noopener">
                    arrêté du 11 avril 2025
                  </a>{' '}
                  portant sur l’année 2023, ou la moyenne des années 2021, 2022 et 2023.
                </Text>
                {!isCold && <Property label="Taux d’EnR&R" value={network['Taux EnR&R']} unit="%" />}
                <Property
                  label="Contenu CO2 ACV"
                  value={network['contenu CO2 ACV']}
                  formatter={formatCO2}
                  tooltip="ACV : en analyse du cycle de vie (émissions directes et indirectes)."
                />
                <Property label="Contenu CO2" value={network['contenu CO2']} formatter={formatCO2} tooltip="Émissions directes" />
                <Property
                  label="Année de référence"
                  value={network['Moyenne-annee-DPE'] === 'Moyenne' ? 'Moyenne 2021-2022-2023' : network['Moyenne-annee-DPE']}
                />
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
                <Box borderLeft="2px solid grey" pl="2w">
                  <Property label="Points de livraison" value={network.nb_pdl} />
                  <Property
                    label={`Livraisons totales de ${isCold ? 'froid' : 'chaleur'}`}
                    value={network.livraisons_totale_MWh}
                    formatter={formatMWh}
                  />
                  <Accordion
                    label={
                      <>
                        <Icon name="fr-icon-list-unordered" size="sm" mr="1w" />
                        Détail par secteur
                      </>
                    }
                    simple
                    small
                    bordered
                    className="fr-pt-0"
                  >
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
                  {!isCold && (
                    <Accordion
                      label={
                        <>
                          <Icon name="fr-icon-list-unordered" size="sm" mr="1w" />
                          Détail par type d’énergie
                        </>
                      }
                      simple
                      small
                      bordered
                      className="fr-pt-0"
                    >
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
                      <Property
                        label="Biomasse solide"
                        value={network.prod_MWh_biomasse_solide}
                        formatter={formatMWh}
                        simpleLabel
                        skipEmpty
                      />
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
                        label="Chaleur industrielle"
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
                  )}

                  <Property label="Puissance totale installée" value={network.puissance_totale_MW} formatter={formatMW} />
                  {!isCold && (
                    <Accordion
                      label={
                        <>
                          <Icon name="fr-icon-list-unordered" size="sm" mr="1w" />
                          Détail par type d’énergie
                        </>
                      }
                      simple
                      small
                      bordered
                      className="fr-pt-0"
                    >
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
                        label="Chaleur industrielle"
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
                  )}

                  <Property
                    label="Rendement"
                    value={network['Rend%']}
                    round
                    unit="%"
                    tooltip="Rapport entre l'énergie thermique livrée aux abonnés et l'énergie thermique injectée dans le réseau."
                  />
                  {!isCold && (
                    <Property
                      label="Développement du réseau"
                      value={network['Dev_reseau%']}
                      round
                      unit="%"
                      tooltip="Ratio entre le nombre de nouveaux abonnés en 2022 et le nombre total d'abonnés en 2021."
                    />
                  )}
                </Box>

                <Text size="sm" fontStyle="italic" my="2w">
                  <Text as="span" underline>
                    Données pour l'année 2021
                  </Text>
                  &nbsp;(ces données ne sont plus actualisées avec le même niveau de précision)
                </Text>
                <Box borderLeft="2px solid grey" pl="2w">
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
                </Box>
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

                <Text size="sm" fontStyle="italic" mb="2w">
                  <Text as="span" underline>
                    Données pour l'année 2023
                  </Text>
                  , disponibles pour les réseaux classés - sauf opposition du maître d'ouvrage ou gestionnaire du réseau
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
                            round
                            unit="%"
                          />
                        )}
                        {isDefined(network['PF%']) && (
                          <Property label={<Box ml="2w">% de la part fixe (abonnement)</Box>} value={network['PF%']} round unit="%" />
                        )}
                      </>
                    )}
                  </>
                ) : (
                  <div>Ces informations ne sont pas disponibles.</div>
                )}
              </BoxSection>
            )}

            {(!displayBlocks || displayBlocks.includes('contacts')) && (
              <BoxSection>
                <Heading as="h3" color="blue-france">
                  Contacts
                </Heading>
                <Property label="Maître d'Ouvrage" value={network.MO} />
                <Property label="Gestionnaire" value={network.Gestionnaire} />
                <Property
                  label="Site Internet"
                  value={network.website_gestionnaire}
                  formatter={(url) => (
                    <Link href={getFullURL(url)} isExternal>
                      {url}
                    </Link>
                  )}
                  valueRenderer={(v) => (
                    <Box textAlign="right" overflow="hidden">
                      {v}
                    </Box>
                  )}
                  flexWrap="wrap"
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
                <Heading as="h3" color="blue-france" mb="2w">
                  Mix énergétique
                </Heading>
                <Text size="sm" fontStyle="italic" underline>
                  Données pour l'année 2023
                </Text>
                {isDefined(network.production_totale_MWh) ? <EnergiesChart network={network} /> : <Text>Non connu</Text>}
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
            {(!displayBlocks || displayBlocks.includes('communes')) && (
              <Box fontStyle="italic" fontSize="12px">
                Commune{network.communes.length > 1 ? 's' : ''} d'implantation : {network.communes.join(', ')}
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
              </Link>{' '}
              et{' '}
              <Link href="https://fedene.fr/ressource/bibliotheque-de-donnees-des-reseaux-de-chaleur-et-de-froid-2024/" isExternal>
                bibliothèque de données de la Fedene Réseaux de chaleur et de froid
              </Link>
            </li>
            <li>Données 2021 : ViaSeva.</li>
          </ul>

          <img src="/logo-fedene.svg" alt="logo fedene" height="50px" className="reset-height inline-block fr-mr-2w" />
          <img src="/logo-amorce.svg" alt="logo amorce" height="50px" className="reset-height inline-block" />
        </Box>
      )}
    </>
  );
};

export default NetworkPanel;

type PropertyProps<T> = {
  label: string | ReactElement;
  value: T | undefined;
  unit?: string; // overridden by the formatter if present
  round?: boolean;
  formatter?: (value: T) => string | ReactElement;
  tooltip?: string | ReactElement;
  simpleLabel?: boolean;
  skipEmpty?: boolean;
  valueRenderer?: (valueContent: string | ReactElement) => ReactElement;
} & BoxProps;
const Property = <T,>({
  label,
  value,
  unit,
  formatter,
  tooltip,
  round,
  simpleLabel,
  skipEmpty,
  valueRenderer = (valueContent: string | ReactElement) => <Box textAlign="right">{valueContent}</Box>,
  ...props
}: PropertyProps<T>) =>
  ((skipEmpty && isDefined(value) && value !== 0) || !skipEmpty) && (
    <Box display="flex" justifyContent="space-between" alignItems="center" columnGap="8px" {...props}>
      <Box display="flex" alignItems="center">
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
      {valueRenderer(
        isDefined(value)
          ? isDefined(formatter)
            ? formatter(value)
            : `${typeof value === 'number' ? prettyFormatNumber(value, round ? 0 : undefined) : value} ${unit ?? ''}`
          : 'Non connu'
      )}
    </Box>
  );

function numberBooleanFormatter(value: string): string | ReactElement {
  return !isNaN(Number.parseFloat(value)) ? `${Math.round(Number.parseFloat(value))} %` : value.toLowerCase() === 'oui' ? 'Oui' : 'Non';
}

function formatCO2(co2kg: number): string {
  return `${Math.round(co2kg * 1000)} gCO2/kWh`;
}
