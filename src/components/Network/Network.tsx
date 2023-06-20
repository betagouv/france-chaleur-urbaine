import Map from '@components/Map/Map';
import { useMemo } from 'react';
import Chart from 'react-google-charts';
import { Network } from 'src/types/Summary/Network';
import {
  BlueBox,
  Box,
  BoxContent,
  Colmun,
  MapContainer,
  Title,
} from './Network.styles';

const getConso = (conso: number) => {
  if (conso > 1000) {
    return `${(conso / 1000).toFixed(2)} GWh`;
  }

  return `${conso.toFixed(2)} MWh`;
};

const getGraphOptions = (network: Network) => [
  ['Catégorie', 'Production'],
  ['UVE', network.prod_MWh_dechets_internes + network.prod_MWh_UIOM, '#d1570c'],
  ['Chaleur industrielle', network.prod_MWh_chaleur_industiel, '#652a96'],
  ['Biomasse', network.prod_MWh_biomasse_solide, '#87ca46'],
  ['Géothermie', network.prod_MWh_geothermie, '#c4218e'],
  [
    'Autres ENR&R',
    network.prod_MWh_solaire_thermique +
      network.prod_MWh_biogaz +
      network.prod_MWh_PAC_ENR +
      network.prod_MWh_autres_ENR +
      network.prod_MWh_autre_RCU_ENR +
      network.prod_MWh_autre_chaleur_recuperee_ENR,
    '#bcd090',
  ],
  [
    'Chaufferies électriques',
    network.prod_MWh_chaudieres_electriques,
    '#e81919',
  ],
  ['Gaz naturel', network.prod_MWh_gaz_naturel, '#ffb800'],
  ['Charbon', network.prod_MWh_charbon, '#000000'],
  [
    'Fiouls',
    network.prod_MWh_fioul_domestique + network.prod_MWh_fioul_lourd,
    '#0065b8',
  ],
  ['GPL', network.prod_MWh_GPL, '#0009b7'],
  [
    'Autres énergies fossiles',
    network.prod_MWh_autres_nonENR +
      network.prod_MWh_autre_RCU_nonENR +
      network.prod_MWh_PAC_nonENR +
      network.prod_MWh_autre_chaleur_recuperee_nonENR,
    '#747474',
  ],
];

const Network = ({ network }: { network: Network }) => {
  const graphOptions = useMemo(() => getGraphOptions(network), [network]);

  return (
    <>
      <Title>
        {network.nom_reseau} ({network['Identifiant reseau']})
      </Title>
      <div className="fr-grid-row fr-grid-row--gutters">
        <Colmun className="fr-col-12 fr-col-lg-6">
          <BlueBox>
            <h3>Performances environnementales</h3>
            <BoxContent>
              <div>
                <b>Taux d’EnR&R</b>
              </div>
              <div>{network['Taux EnR&R']} %</div>
            </BoxContent>
            <BoxContent>
              <div>
                <b>Contenu CO2 ACV</b>
              </div>
              <div>{network['contenu CO2 ACV']} g CO2/kWh</div>
            </BoxContent>
            <BoxContent>
              <div>
                <b>Rendement</b>
              </div>
              <div>{network['Rend%']} %</div>
            </BoxContent>
          </BlueBox>
          <Box>
            <h3>Informations tarifaires</h3>
            <BoxContent>
              <div>
                <b>Prix moyen de la chaleur (2021)</b>
              </div>
              <div>{network.PM} €/MWh</div>
            </BoxContent>
            <br />
            <div>
              <b>Prix moyen par catégorie d'abonnés (2021)</b>
            </div>
            <BoxContent>
              <div className="fr-ml-2w">Logements</div>
              <div>{network.PM_L} €/MWh</div>
            </BoxContent>
            <BoxContent>
              <div className="fr-ml-2w">Tertiaire</div>
              <div>{network.PM_T} €/MWh</div>
            </BoxContent>
            <br />
            <div>
              <b>Poids respectifs des parts fixe et variable</b>
            </div>
            <BoxContent>
              <div className="fr-ml-2w">
                % de la part variable (fonction des consommations)
              </div>
              <div>{network['PV%']}%</div>
            </BoxContent>
            <BoxContent>
              <div className="fr-ml-2w"> % de la part fixe (abonnement)</div>
              <div>{network['PF%']}%</div>
            </BoxContent>
          </Box>
          <Box>
            <h3>Caractéristiques techniques</h3>
            <BoxContent>
              <div>
                <b>Livraisons totales de chaleur</b>
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
            <br />
            <BoxContent>
              <div>
                <b>Année de création du réseau</b>
              </div>
              <div>{network.annee_creation}</div>
            </BoxContent>
            <BoxContent>
              <div>
                <b>Fluide caloporteur - eau chaude</b>
              </div>
              <div>
                {network['%_fluide_caloporteur_eau_chaude'].toFixed(2)} %
              </div>
            </BoxContent>
            <BoxContent>
              <div>
                <b>Fluide caloporteur - eau surchauffée</b>
              </div>
              <div>
                {network['%_fluide_caloporteur_eau_surchauffee'].toFixed(2)} %
              </div>
            </BoxContent>
            <BoxContent>
              <div>
                <b>Fluide caloporteur - vapeur</b>
              </div>
              <div>{network['%_fluide_caloporteur_vapeur'].toFixed(2)} %</div>
            </BoxContent>
          </Box>
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
              <div>
                {network.adresse_mo} {network.CP_MO} {network.ville_mo}
              </div>
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
              <div>
                {network.adresse_gestionnaire} {network.CP_gestionnaire}{' '}
                {network.ville_gestionnaire}
              </div>
            </BoxContent>
          </Box>
        </Colmun>
        <div className="fr-col-12 fr-col-lg-6">
          <Box>
            <h3>Mix énergétique</h3>
            <Chart
              width="100%"
              height="400px"
              chartType="PieChart"
              chartLanguage="FR-fr"
              loader={<div>Chargement du graph...</div>}
              data={graphOptions.map((mix, index) =>
                index === 0 ? mix : [mix[0], { v: mix[1], f: `${mix[1]} MWh` }]
              )}
              options={{
                colors: graphOptions
                  .slice(1)
                  .map((option) => option[2] as string),
                chartArea: { width: '100%', height: '90%' },
                pieHole: 0.6,
                legend: {
                  position: 'labeled',
                  alignment: 'center',
                  labeledValueText: 'percent',
                },
                pieSliceText: 'none',
              }}
            />
          </Box>
          <MapContainer className="fr-mt-2w">
            <Map
              noPopup
              center={[network.lon, network.lat]}
              initialLayerDisplay={{
                outline: true,
                futurOutline: false,
                coldOutline: false,
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
        </div>
      </div>
      <p className="fr-mt-4w fr-hint-text">
        Sources : Annuaire Via Sèva / Arrêté du 16 mars 2023 relatif au
        classement des réseaux de chaleur et de froid / Enquête annuelle des
        réseaux de chaleur et de froid, édition 2022 pour l’année 2021, SNCU /
        Données locales de l’énergie pour l’année 2021, SDES{' '}
      </p>
    </>
  );
};

export default Network;
