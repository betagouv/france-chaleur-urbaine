import { readFile } from 'fs/promises';

import { serverConfig } from '@/server/config';
import { dayjs } from '@/utils/date';
import { fetchJSON } from '@/utils/network';

export interface DataGouvResource {
  id: string;
  title: string;
  description?: string;
  type: string;
  format?: string;
  url?: string;
  latest?: string;
}

export interface DataGouvDataset {
  id: string;
  title: string;
  description?: string;
  resources: DataGouvResource[];
}

export interface UploadResourcePayload {
  title: string;
  description?: string;
  type?: 'main' | 'update';
  format?: string;
}

export interface CreateResourcePayload {
  title: string;
  description?: string;
  type?: 'main' | 'update';
  format?: string;
  filetype?: 'file' | 'remote';
  url?: string;
}

/**
 * Service pour interagir avec l'API data.gouv.fr
 */
export class APIDataGouvService {
  private apiUrl = serverConfig.DATA_GOUV_FR_API_URL;
  private apiKey: string;

  constructor() {
    if (!serverConfig.DATA_GOUV_FR_API_KEY) {
      throw new Error(
        "Clé API data.gouv.fr manquante. Définissez DATA_GOUV_FR_API_KEY dans les variables d'environnement. (à générer sur https://www.data.gouv.fr/admin/me/profile)"
      );
    }

    this.apiKey = serverConfig.DATA_GOUV_FR_API_KEY;
  }

  private getHeaders(): Record<string, string> {
    return {
      Accept: 'application/json',
      'X-Api-Key': this.apiKey,
    };
  }

  /**
   * Récupère les informations d'un dataset
   */
  async getDataset(datasetId: string): Promise<DataGouvDataset> {
    const url = `${this.apiUrl}/datasets/${datasetId}/`;

    return fetchJSON<DataGouvDataset>(url, {
      headers: this.getHeaders(),
    });
  }

  /**
   * Met à jour les métadonnées d'une ressource existante
   */
  async updateResourceMetadata(datasetId: string, resourceId: string, payload: Partial<CreateResourcePayload>): Promise<DataGouvResource> {
    const url = `${this.apiUrl}/datasets/${datasetId}/resources/${resourceId}/`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update resource metadata: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Upload un fichier et crée une nouvelle ressource dans un dataset
   * Utilise l'endpoint /upload/ qui crée et upload en une seule fois
   */
  async uploadFileAndCreateResource(datasetId: string, filePath: string, resourceInfo: UploadResourcePayload): Promise<DataGouvResource> {
    const url = `${this.apiUrl}/datasets/${datasetId}/upload/`;

    const formData = new FormData();
    const fileBuffer = await readFile(filePath);

    // Crée un Blob à partir du buffer pour pouvoir l'ajouter au FormData
    const blob = new Blob([fileBuffer], { type: 'application/zip' });
    formData.append('file', blob, resourceInfo.title);

    // Ajoute les métadonnées de la ressource si fournies
    (['title', 'description', 'type', 'format'] as const).forEach(
      (fieldName) => resourceInfo[fieldName] && formData.append(fieldName, resourceInfo[fieldName])
    );

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload file and create resource: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Crée une ressource de type "update" et y uploade un fichier
   */
  async createUpdateResourceWithFile(datasetId: string, filePath: string, title: string, description?: string): Promise<DataGouvResource> {
    // 1. Crée la ressource avec le fichier (utilise l'endpoint /upload/)
    const resource = await this.uploadFileAndCreateResource(datasetId, filePath, {
      title,
      description,
      format: 'zip',
    });

    // 2. Met à jour les métadonnées pour marquer comme type "update"
    const updatedResource = await this.updateResourceMetadata(datasetId, resource.id, {
      title,
      description,
      type: 'update',
    });

    return updatedResource;
  }

  /**
   * Upload un fichier vers une ressource
   */
  async uploadFileToResource(datasetId: string, resourceId: string, filePath: string, fileName: string): Promise<DataGouvResource> {
    const url = `${this.apiUrl}/datasets/${datasetId}/resources/${resourceId}/upload/`;

    const formData = new FormData();
    const fileBuffer = await readFile(filePath);

    // Crée un Blob à partir du buffer pour pouvoir l'ajouter au FormData
    const blob = new Blob([fileBuffer], { type: 'application/zip' });
    formData.append('file', blob, fileName);

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload file: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Met à jour le fichier principal d'un dataset
   */
  async updateMainResource(datasetId: string, filePath: string): Promise<DataGouvResource> {
    // D'abord, récupère les informations du dataset pour trouver la ressource principale
    const dataset = await this.getDataset(datasetId);

    // Trouve la ressource principale (généralement la première ou celle avec type 'main')
    const mainResource = dataset.resources.find((r) => r.type === 'main') || dataset.resources[0];

    if (!mainResource) {
      throw new Error('Aucune ressource principale trouvée dans le dataset');
    }

    return this.uploadFileToResource(datasetId, mainResource.id, filePath, mainResource.title);
  }

  /**
   * Publie une nouvelle version de l'archive opendata
   * Crée une ressource "mise à jour" et met à jour le fichier principal
   */
  async publishOpendataArchive(filePath: string, updateDescription?: string): Promise<void> {
    // 1. Crée une ressource "mise à jour" et uploade le fichier
    await this.createUpdateResourceWithFile(
      serverConfig.DATA_GOUV_FR_DATASET_ID!,
      filePath,
      `${dayjs().format('DDMMYY')}-opendata-fcu.zip`,
      updateDescription
    );

    // 2. Met à jour le fichier principal
    await this.updateMainResource(serverConfig.DATA_GOUV_FR_DATASET_ID!, filePath);
  }
}
