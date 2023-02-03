import { DemandSummary } from 'src/types/Summary/Demand';
import { EnergySummary } from 'src/types/Summary/Energy';
import { GasSummary } from 'src/types/Summary/Gas';
import { NetworkSummary } from 'src/types/Summary/Network';
import { objTypeEnergy } from './Map.style';

const writeTypeConso = (typeConso: string | unknown) => {
  switch (typeConso) {
    case 'R': {
      return 'Logement';
    }
    case 'T': {
      return 'Établissement tertiaire';
    }
    case 'I': {
      return 'Industrie';
    }
  }
  return '';
};

const formatBddText = (str?: string) => {
  return (
    str &&
    str
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/electricite/g, 'électricité')
      .replace(/reseau/g, 'réseau')
  );
};

export const formatBodyPopup = ({
  buildings,
  consommation,
  demands,
  energy,
  network,
}: {
  buildings?: EnergySummary;
  consommation?: GasSummary;
  energy?: EnergySummary;
  demands?: DemandSummary;
  network?: NetworkSummary;
}) => {
  const {
    nb_logements,
    annee_construction,
    type_usage,
    energie_utilisee: energie_utilisee_buildings,
    type_chauffage: type_chauffage_buildings,
    addr_label: addr_label_buildings,
    dpe_energie,
    dpe_ges,
  } = buildings || energy || {};
  const { adresse, nom_commun, code_grand, conso_nb } = consommation || {};
  const addr_label_consommation = adresse ? `${adresse} ${nom_commun}` : '';
  const {
    Adresse: addr_label_demands,
    'Mode de chauffage': mode_chauffage_demands,
    'Type de chauffage': type_chauffage_demands,
    Structure: structure,
  } = demands || {};

  const energie_utilisee = energie_utilisee_buildings || mode_chauffage_demands;
  const textAddress =
    addr_label_buildings || addr_label_consommation || addr_label_demands;
  const type_chauffage = type_chauffage_buildings || type_chauffage_demands;

  const displayNetwork =
    network && !(buildings || consommation || demands || energy);
  const bodyPopup = `
    ${
      textAddress
        ? `
          <header>
            <h6>${textAddress}</h6>
          </header>`
        : ''
    }
    ${`
        <section>
          ${
            code_grand
              ? `<strong><u></u>${writeTypeConso(
                  code_grand
                )}</u></strong><br />`
              : ''
          }
          ${
            annee_construction
              ? `<strong>Année de construction&nbsp;:</strong> ${annee_construction}<br />`
              : ''
          }
          ${
            type_usage
              ? `<strong>Usage&nbsp;:</strong> ${type_usage}<br />`
              : ''
          }
          ${
            nb_logements
              ? `<strong>Nombre de logements&nbsp;:</strong> ${nb_logements}<br />`
              : ''
          }
          ${
            energie_utilisee
              ? `<strong>Chauffage actuel&nbsp;:</strong> ${formatBddText(
                  energie_utilisee
                )}<br />`
              : ''
          }
          ${
            type_chauffage
              ? `<strong>Mode de chauffage&nbsp;:</strong> ${type_chauffage}<br />`
              : ''
          }
          ${
            conso_nb &&
            (!energie_utilisee || objTypeEnergy?.gas.includes(energie_utilisee))
              ? `<strong>Consommations de gaz&nbsp;:</strong> ${conso_nb.toFixed(
                  2
                )}&nbsp;MWh<br />`
              : ''
          }
          ${
            dpe_energie
              ? `<strong>DPE consommations énergétiques&nbsp;:</strong> ${dpe_energie}<br />`
              : ''
          }
          ${
            dpe_ges
              ? `<strong>DPE émissions de gaz à effet de serre&nbsp;:</strong> ${dpe_ges}<br />`
              : ''
          }
          ${
            structure
              ? `<strong>Structure&nbsp;:</strong> ${structure}<br />`
              : ''
          }
          ${
            displayNetwork
              ? `
            ${
              network.commentaires
                ? `<strong>
                  ${network.commentaires}
                  </strong>
                <br />
                `
                : ''
            } 
            <strong>Identifiant&nbsp;:</strong> ${
              network['Identifiant reseau']
                ? `${network['Identifiant reseau']}`
                : 'Non connu'
            }<br />
            <strong>Gestionnaire&nbsp;:</strong> ${
              network.Gestionnaire ? `${network.Gestionnaire}` : 'Non connu'
            }<br />
            <strong>Taux EnR&R&nbsp;:</strong> ${
              network['Taux EnR&R'] !== null &&
              network['Taux EnR&R'] !== undefined
                ? `${network['Taux EnR&R']}%`
                : 'Non connu'
            }<br /> 
            <strong>Contenu&nbsp;CO2&nbsp;ACV&nbsp;:</strong> ${
              network['contenu CO2 ACV']
                ? `${Math.round(network['contenu CO2 ACV'] * 1000)} g/kWh`
                : 'Non connu'
            }<br />
          `
              : ''
          }
        </section>
      `}
  `;
  return bodyPopup;
};
