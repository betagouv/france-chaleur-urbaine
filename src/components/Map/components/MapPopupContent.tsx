import Link from 'next/link';

import { type DemandSummary } from '@/types/Summary/Demand';
import { type EnergySummary } from '@/types/Summary/Energy';
import { type FuturNetworkSummary } from '@/types/Summary/FuturNetwork';
import { type GasSummary } from '@/types/Summary/Gas';
import { type NetworkSummary } from '@/types/Summary/Network';
import { isDefined } from '@/utils/core';

import { objTypeEnergy } from './layers/typeChauffageBatimentsCollectifs';
import { PopupTitle } from '../Map.style';

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

const MapPopupContent = ({
  buildings,
  consommation,
  demands,
  energy,
  network,
  futurNetwork,
}: {
  buildings?: EnergySummary;
  consommation?: GasSummary;
  energy?: EnergySummary;
  demands?: DemandSummary;
  network?: NetworkSummary;
  futurNetwork?: FuturNetworkSummary;
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
  const textAddress = addr_label_buildings || addr_label_consommation || addr_label_demands;
  const type_chauffage = type_chauffage_buildings || type_chauffage_demands;

  const displayNetwork = (network || futurNetwork) && !(buildings || consommation || demands || energy);

  return (
    <>
      {textAddress && textAddress !== 'pb' && (
        <header>
          <h6>{textAddress}</h6>
        </header>
      )}
      <section>
        {code_grand && (
          <>
            <strong>
              <u>{writeTypeConso(code_grand)}</u>
            </strong>
            <br />
          </>
        )}
        {annee_construction && (
          <>
            <strong>Année de construction&nbsp;:</strong>&nbsp;
            {annee_construction}
            <br />
          </>
        )}
        {type_usage && (
          <>
            <strong>Usage&nbsp;:</strong>&nbsp;{type_usage}
            <br />
          </>
        )}
        {isDefined(nb_logements) && (
          <>
            <strong>Nombre de logements&nbsp;:</strong>&nbsp;{nb_logements}
            <br />
          </>
        )}
        {energie_utilisee && (
          <>
            <strong>Chauffage actuel&nbsp;:</strong>&nbsp;
            {formatBddText(energie_utilisee)}
            <br />
          </>
        )}
        {type_chauffage && (
          <>
            <strong>Mode de chauffage&nbsp;:</strong>&nbsp;{type_chauffage}
            <br />
          </>
        )}
        {conso_nb && (!energie_utilisee || objTypeEnergy?.gas.includes(energie_utilisee)) && (
          <>
            <strong>Conso. gaz&nbsp;:</strong>&nbsp;
            {conso_nb.toFixed(2)}
            &nbsp;MWh/an
            <br />
          </>
        )}
        {dpe_energie && (
          <>
            <strong>DPE consommations énergétiques&nbsp;:</strong>&nbsp;
            {dpe_energie}
            <br />
          </>
        )}
        {dpe_ges && (
          <>
            <strong>DPE émissions de gaz à effet de serre&nbsp;:</strong>&nbsp;
            {dpe_ges}
            <br />
          </>
        )}
        {structure && (
          <>
            <strong>Structure&nbsp;:</strong>&nbsp;{structure}
            <br />
          </>
        )}
        {displayNetwork && network && (
          <>
            {network.nom_reseau && <PopupTitle>{network.nom_reseau}</PopupTitle>}
            <strong>Identifiant&nbsp;:</strong>&nbsp;
            {network['Identifiant reseau'] ? network['Identifiant reseau'] : 'Non connu'}
            <br />
            <strong>Gestionnaire&nbsp;:</strong>&nbsp;
            {network.Gestionnaire ? network.Gestionnaire : 'Non connu'}
            <br />
            {!network.isCold && (
              <>
                <strong>Taux EnR&R&nbsp;:</strong>&nbsp;
                {network['Taux EnR&R'] !== null && network['Taux EnR&R'] !== undefined ? network['Taux EnR&R'] + '%' : 'Non connu'}
                <br />
              </>
            )}
            <strong>
              Contenu&nbsp;CO<sub>2</sub>&nbsp;ACV&nbsp;:
            </strong>
            &nbsp;
            {network['contenu CO2 ACV'] ? Math.round(network['contenu CO2 ACV'] * 1000) + 'g/kWh' : 'Non connu'}
            <br />
            {network['Identifiant reseau'] && (
              <Link href={`/reseaux/${network['Identifiant reseau']}`} target="_blank" rel="noopener noreferrer">
                Voir la fiche du réseau
              </Link>
            )}
          </>
        )}
        {displayNetwork && futurNetwork && (
          <>
            <strong>Gestionnaire&nbsp;:</strong>&nbsp;
            {futurNetwork.gestionnaire ? futurNetwork.gestionnaire : 'Non connu'}
            <br />
            <strong>Mise en service&nbsp;:</strong>&nbsp;
            {futurNetwork.mise_en_service ? futurNetwork.mise_en_service : 'Non connu'}
            <br />
          </>
        )}
      </section>
    </>
  );
};

export default MapPopupContent;

export const ViasevaPopupContent = ({ network, futurNetwork }: { network?: NetworkSummary; futurNetwork?: FuturNetworkSummary }) => {
  return (
    <>
      {network ? (
        <section>
          {network.nom_reseau && <PopupTitle>{network.nom_reseau}</PopupTitle>}
          {!network.isCold && (
            <>
              <strong>Taux EnR&R&nbsp;:</strong>&nbsp;
              {network['Taux EnR&R'] !== null && network['Taux EnR&R'] !== undefined ? network['Taux EnR&R'] + '%' : 'Non connu'}
              <br />
            </>
          )}
          <strong>
            Contenu&nbsp;CO<sub>2</sub>&nbsp;ACV&nbsp;:&nbsp;
          </strong>
          {network['contenu CO2 ACV'] ? Math.round(network['contenu CO2 ACV'] * 1000) + 'g/kWh' : 'Non connu'}
          <br />
          <strong>
            Livraison totale de {network.isCold ? 'froid' : 'chaleur'}
            &nbsp;:&nbsp;
          </strong>
          {network.livraisons_totale_MWh ? `${getConso(network.livraisons_totale_MWh)}/an` : 'Non connu'}
          <br />
          <strong>Nombre de bâtiments raccordés&nbsp;:</strong>&nbsp;
          {network.nb_pdl ? network.nb_pdl : 'Non connu'}
          <br />
          {network['Identifiant reseau'] && (
            <a href={`/reseaux/${network['Identifiant reseau']}`} target="_blank" rel="noopener noreferrer">
              Voir la fiche du réseau
            </a>
          )}
        </section>
      ) : (
        futurNetwork && (
          <section>
            <strong>Gestionnaire&nbsp;:</strong>&nbsp;
            {futurNetwork.gestionnaire ? futurNetwork.gestionnaire : 'Non connu'}
            <br />
            <strong>Mise en service&nbsp;:</strong>&nbsp;
            {futurNetwork.mise_en_service ? futurNetwork.mise_en_service : 'Non connu'}
          </section>
        )
      )}
    </>
  );
};

const getConso = (conso: number) => {
  if (isDefined(conso)) {
    if (conso > 1000) {
      return `${(conso / 1000).toFixed(2)} GWh`;
    }

    return `${conso.toFixed(2)} MWh`;
  }
  return 'Non connu';
};
