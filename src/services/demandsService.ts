import { HttpClient } from 'src/services/http';
import { Demand } from 'src/types/Summary/Demand';
import { ServiceError } from './errors';

export type RowsParams = {
  name: string;
  label: string;
  render?: (d: Demand) => any;
  editable?: 'checkbox' | 'radio' | 'textarea' | 'text';
};

export const demandRowsParams: RowsParams[] = [
  {
    name: 'Nom',
    label: 'Nom',
    render: ({ Prénom, Nom }) => `${Prénom ? `${Prénom} ` : ''}${Nom}`,
  },
  { name: 'Structure', label: 'Structure' },
  { name: 'Établissement', label: 'Établissement' },
  { name: 'Mail', label: 'Email' },
  { name: 'Adresse', label: 'Adresse' },
  { name: 'Distance au réseau', label: 'Distance au réseau' },
  { name: 'Type de chauffage', label: 'Type de chauffage' },
  { name: 'Mode de chauffage', label: 'Mode de chauffage' },
];

export const demandEditableRowsParams: RowsParams[] = [
  {
    name: 'Date de mise à jour',
    label: 'Date de mise à jour',
    render: ({ 'Date de mise à jour': dateMaj }) =>
      new Date(dateMaj).toLocaleString(),
  },
  {
    name: 'Raccordable',
    label: 'Raccordement envisageable',
    editable: 'checkbox',
  },
  {
    name: 'Prise de contact',
    label: 'Prise de contact avec le demandeur réalisée par l’exploitant',
    editable: 'checkbox',
  },
  {
    name: 'En attente d’éléments',
    label: 'En attente d’éléments complémentaires de la part du demandeur',
    editable: 'checkbox',
  },
  {
    name: 'Etude en cours',
    label: 'Etude en cours',
    editable: 'checkbox',
  },
  {
    name: 'Raccordement abandonné',
    label:
      'Raccordement abandonné par la copropriété / l’établissement tertiaire',
    editable: 'checkbox',
  },
  {
    name: 'Raccordement voté en AG',
    label: 'Raccordement voté en AG de copropriété',
    editable: 'checkbox',
  },
  {
    name: 'Travaux en cours',
    label: 'Travaux en cours',
    editable: 'checkbox',
  },
  {
    name: 'Raccordement effectué',
    label: 'Raccordement effectué',
    editable: 'checkbox',
  },
  {
    name: 'Commentaire',
    label: 'Commentaire',
    editable: 'textarea',
  },
];

export class DemandsService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async fetchDemands(): Promise<Demand[]> {
    try {
      return await this.httpClient.get<Demand[]>(`/api/demands`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }

  async fetchDemand(demandId: string): Promise<Demand> {
    try {
      return await this.httpClient.get<Demand>(`/api/demands/${demandId}`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }

  async updateDemand(
    demandId: string,
    demandUpdate: Record<string, any>
  ): Promise<Record<string, any> & { data: Demand }> {
    try {
      return await this.httpClient.put(
        `/api/demands/${demandId}`,
        demandUpdate
      );
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
