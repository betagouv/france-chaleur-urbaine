import { User } from 'src/types/User';

import { ExportColumn } from './ExportColumn';
import { Demand } from './Summary/Demand';
import { NetworkToCompare } from './Summary/Network';

export const networksToCompareExportColumns: ExportColumn<NetworkToCompare>[] = [
  {
    header: 'Nom du réseau',
    value: 'nom_reseau',
  },
  {
    header: 'Réseau classé',
    value: (network) => (network['reseaux classes'] ? 'Oui' : 'Non'),
  },
  {
    header: 'Identifiant',
    value: 'Identifiant reseau',
  },
  {
    header: 'Communes',
    value: (network) => (network.communes ? network.communes.join(', ') : ''),
  },
  {
    header: 'Gestionnaire',
    value: 'Gestionnaire',
  },
  {
    header: 'Taux EnR&R',
    value: (network) => (network['Taux EnR&R'] ? `${network['Taux EnR&R']}%` : ''),
  },
  {
    header: 'Contenu CO2 ACV (gCO<sub>2</sub>/kWh)',
    value: 'contenu CO2 ACV',
  },
  {
    header: 'Contenu CO2 (gCO<sub>2</sub>/kWh)',
    value: 'contenu CO2',
  },
  {
    header: 'Prix moyen (€TTC/MWh)',
    value: (network) => (network.PM ? Math.round(network.PM) : ''),
  },
  {
    header: 'Année de construction',
    value: 'annee_creation',
  },
  {
    header: 'Livraisons de chaleur annuelles (GWh)',
    value: (network) => (network.livraisons_totale_MWh ? network.livraisons_totale_MWh.toFixed(1) : ''),
  },
  {
    header: 'Biomasse',
    value: (network) => (network.energie_ratio_biomasse ? `${network.energie_ratio_biomasse.toFixed(1)}%` : '0%'),
  },
  {
    header: 'Géothermie',
    value: (network) => (network.energie_ratio_geothermie ? `${network.energie_ratio_geothermie.toFixed(1)}%` : '0%'),
  },
  {
    header: 'UVE',
    value: (network) => (network.energie_ratio_uve ? `${network.energie_ratio_uve.toFixed(1)}%` : '0%'),
  },
  {
    header: 'Chaleur industrielle',
    value: (network) => (network.energie_ratio_chaleurIndustrielle ? `${network.energie_ratio_chaleurIndustrielle.toFixed(1)}%` : '0%'),
  },
  {
    header: 'Solaire thermique',
    value: (network) => (network.energie_ratio_solaireThermique ? `${network.energie_ratio_solaireThermique.toFixed(1)}%` : '0%'),
  },
  {
    header: 'Pompe à chaleur',
    value: (network) => (network.energie_ratio_pompeAChaleur ? `${network.energie_ratio_pompeAChaleur.toFixed(1)}%` : '0%'),
  },
  {
    header: 'Gaz',
    value: (network) => (network.energie_ratio_gaz ? `${network.energie_ratio_gaz.toFixed(1)}%` : '0%'),
  },
  {
    header: 'Fioul',
    value: (network) => (network.energie_ratio_fioul ? `${network.energie_ratio_fioul.toFixed(1)}%` : '0%'),
  },
];

export const demandsExportColumns: ExportColumn<Demand>[] = [
  {
    header: 'Statut',
    value: 'Status',
  },
  {
    header: 'Prospect recontacté',
    value: (demand) => (demand['Prise de contact'] ? 'Oui' : 'Non'),
  },
  {
    header: 'Nom',
    value: (demand) => `${demand.Prénom ? demand.Prénom : ''} ${demand.Nom}`,
  },
  { header: 'Mail', value: 'Mail' },
  { header: 'Téléphone', value: 'Téléphone' },
  { header: 'Adresse', value: 'Adresse' },
  {
    header: 'En PDP',
    value: 'en PDP',
  },
  { header: 'Date de demande', value: 'Date demandes' },
  { header: 'Type', value: 'Structure' },
  { header: 'Structure', value: 'Établissement' },
  {
    header: 'Mode de chauffage',
    value: 'Mode de chauffage',
  },
  {
    header: 'Type de chauffage',
    value: 'Type de chauffage',
  },
  {
    header: 'Distance au réseau (m)',
    value: (demand) =>
      demand['Gestionnaire Distance au réseau'] === undefined ? demand['Distance au réseau'] : demand['Gestionnaire Distance au réseau'],
  },
  { header: 'ID réseau le plus proche', value: 'Identifiant réseau' },
  { header: 'Nom du réseau le plus proche', value: 'Nom réseau' },
  {
    header: 'Nb logements',
    value: (demand) => (demand['Gestionnaire Logement'] === undefined ? demand['Logement'] : demand['Gestionnaire Logement']),
  },
  {
    header: 'Surface en m2',
    value: 'Surface en m2',
  },
  {
    header: 'Conso gaz (MWh)',
    value: (demand) => (demand['Gestionnaire Conso'] === undefined ? demand['Conso'] : demand['Gestionnaire Conso']),
  },
  { header: 'Commentaires', value: 'Commentaire' },
  {
    header: 'Affecté à',
    value: 'Affecté à',
  },
];

export const usersExportColumns: ExportColumn<User>[] = [
  {
    header: 'Email',
    value: 'email',
  },
  {
    header: 'Date de création du compte',
    value: (user) => new Date(user.created_at).toLocaleDateString('fr-FR'),
  },
  {
    header: 'Compte actif',
    value: (user) => `${user.active ? 'Oui' : 'Non'}`,
  },
];

interface ExportConfListFormat {
  [index: string]: {
    filename: string;
    columns: ExportColumn<any>[];
  };
}

export const exportsParams: ExportConfListFormat = {
  networksToCompare: {
    filename: 'networks_liste',
    columns: networksToCompareExportColumns,
  },
  demands: {
    filename: 'demands_fcu',
    columns: demandsExportColumns,
  },
  obsoleteUsers: {
    filename: 'comptes_obsoletes',
    columns: usersExportColumns,
  },
};
