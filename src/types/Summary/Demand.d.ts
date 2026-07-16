import type { ModeDeChauffageLabel, TypeDeChauffageLabel } from '@/modules/demands/constants';
import type { DemandStatus } from '@/types/enum/DemandSatus';

export type DemandSummary = {
  id: string;
  Nom: string;
  Prénom?: string;
  Adresse: string;
  'Mode de chauffage': ModeDeChauffageLabel;
  'Type de chauffage': TypeDeChauffageLabel;
  Structure: string;
};

export type EditableDemandSummary = {
  Commentaire: string;
  Status: DemandStatus | '';
};

export type Demand = DemandSummary &
  EditableDemandSummary & {
    id: string;
    Mail: string;
    Téléphone: string;
    Éligibilité: boolean;
    'Distance au réseau': number | null;
    'Gestionnaire Distance au réseau': number;
    'N° de dossier': number;
    'en PDP': string;
    /** @deprecated use 'Date de la demande' instead */
    'Date demandes': string;
    'Date de la demande': string;
    Établissement: string;
    'Structure accompagnante'?: string;
    'Nom de la structure accompagnante'?: string;
    Ville: string;
    Departement: string;
    Conso: number;
    'Gestionnaire Conso': number;
    Logement: number;
    'Surface en m2': number;
    'Gestionnaire Logement': number;
    'Relance envoyée': string;
    'Identifiant réseau'?: string;
    'Nom réseau'?: string;
    'Emails envoyés'?: string;
    Longitude: number;
    Latitude: number;
    Commentaires_internes_FCU: string;

    // computed
    haut_potentiel: boolean;
  };

export type AdminDemand = Demand & {
  // airtable fields
  'Relance à activer'?: boolean;
};
