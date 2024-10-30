import { downloadFile } from '@utils/browser';
import { HttpClient } from 'src/services/http';
import { exportsParams } from 'src/types/Export';

import { ServiceError } from './errors';

export class ExportService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }

  async exportXLSX(exportType: string, params?: any): Promise<any> {
    try {
      return await this.httpClient.post('api/exportData', { exportType, params }).then(async (response) => {
        const byteCharacters = window.atob(response.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        const url = URL.createObjectURL(new Blob([byteArray]));
        downloadFile(url, `${exportsParams[exportType].filename}.xlsx`);
      });
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
