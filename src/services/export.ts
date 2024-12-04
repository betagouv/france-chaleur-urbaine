import { HttpClient } from '@/services/http';
import { exportsParams } from '@/types/Export';
import { downloadFile } from '@/utils/browser';

import { ServiceError } from './errors';

export class ExportService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }

  async exportXLSX(exportType: string, params?: any): Promise<any> {
    try {
      const response = await this.httpClient.post(
        'api/exportData',
        { exportType, params },
        {
          responseType: 'blob',
        }
      );
      downloadFile(URL.createObjectURL(response.data), `${exportsParams[exportType].filename}.xlsx`);
    } catch (e) {
      throw new ServiceError(e);
    }
  }
}
