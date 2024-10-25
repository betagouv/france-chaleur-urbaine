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
        const a = document.createElement('a');
        a.download = `${exportsParams[exportType].filename}.xlsx`;

        const byteCharacters = window.atob(response.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        a.href = URL.createObjectURL(new Blob([byteArray]));
        a.addEventListener('click', () => {
          setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
        });
        a.click();
      });
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
