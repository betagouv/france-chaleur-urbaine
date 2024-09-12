import { Coords } from '../Coords';

export type DemandSummary = {
  id: string;
  Nom: string;
  Prénom?: string;
  Adresse: string;
  'Mode de chauffage': string;
  'Type de chauffage': string;
  Structure: string;
  Gestionnaires: string[];
};

export type EditableDemandSummary = {
  'Prise de contact': boolean;
  Commentaire: string;
  Status: string;
};

export type Demand = DemandSummary &
  EditableDemandSummary & {
    id: string;
    Mail: string;
    Téléphone: string;
    Éligibilité: boolean;
    'Distance au réseau': number;
    'Gestionnaire Distance au réseau': number;
    'N° de dossier': string;
    'en PDP': string;
    'Date demandes': string;
    Établissement: string;
    'Structure accompagnante'?: string[];
    'Nom de la structure accompagnante'?: string;
    Ville: string;
    Departement: string;
    Conso: number;
    'Gestionnaire Conso': number;
    Logement: number;
    'Surface en m2': number;
    'Gestionnaire Logement': number;
    'Relance envoyée': string;
    'Affecté à': string;
    'Gestionnaire Affecté à': string;
    'Identifiant réseau'?: string;
    'Nom réseau'?: string;
    'Emails envoyés'?: string;
    Longitude: number;
    Latitude: number;
  };

export type ContactFormInfos = {
  structure: AvailableStructure;
  heatingEnergy: string;
  lastName: string;
  firstName: string;
  company: string;
  companyType: string;
  email: string;
  phone: string;
  termOfUse: boolean;
  demandCompanyType: string;
  demandCompanyName: string;
  demandArea?: number;
  nbLogements?: number;
};

export type FormDemandCreation = ContactFormInfos & {
  address: string;
  coords: Coords;
  eligibility: any;
  heatingType: AvailableHeating;
  city: string;
  postcode: string;
  department: string;
  region: string;

  // if the user is on a network page
  networkId?: string;

  // if the user is coming from a campaign or ads
  mtm_campaign?: string;
  mtm_kwd?: string;
  mtm_source?: string;
};

export type AirtableDemandCreation = {
  Nom: string;
  Prénom: string;
  Structure: string;
  Établissement: string;
  'Structure accompagnante': string;
  Éligibilité: boolean;
  Adresse: string;
  Latitude: number;
  Longitude: number;
  Mail: string;
  Téléphone: string;
  'Mode de chauffage': string;
  'Type de chauffage': string;
  'Distance au réseau': number;
  'en PDP': string; // 'Oui' : 'Non',
  Ville: string;
  'Code Postal': string;
  Departement: string;
  Region: string;
  'Nom de la structure accompagnante': string;
  'Surface en m2'?: number;
  Logement?: number;
};
