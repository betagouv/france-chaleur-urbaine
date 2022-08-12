import { AxiosResponse } from 'axios';
import { HttpClient } from 'src/services/http';
import { Coords } from 'src/types/Coords';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { HeatNetworksResponse } from 'src/types/HeatNetworksResponse';
import { Summary } from 'src/types/Summary';
import { ServiceError } from './errors';

export class HeatNetworkService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async findByCoords({ lon, lat }: Coords): Promise<HeatNetworksResponse> {
    try {
      return await this.httpClient.get<HeatNetworksResponse>(
        `/api/map/eligibilityStatus?lat=${lat}&lon=${lon}`
      );
    } catch (e) {
      throw new ServiceError(e);
    }
  }

  async summary(bounds: number[][]): Promise<Summary> {
    try {
      return await this.httpClient.get<Summary>(
        `/api/map/summary?coordinates=${encodeURIComponent(
          JSON.stringify(bounds)
        )}`
      );
    } catch (e) {
      throw new ServiceError(e);
    }
  }
  getFileToDownload = async (
    response: AxiosResponse
  ): Promise<{ fileName: string; blob: Blob }> => {
    let fileName = `export.xlsx`;

    const contentDisposition = response.headers['content-disposition'];
    const contentType = `${response.headers['content-type']}`;

    if (contentDisposition) {
      const content = contentDisposition.split('filename=');
      if (content.length > 1) {
        // eslint-disable-next-line prefer-destructuring
        fileName = content[1];
      }
    }

    const byteCharacters = window.atob(await response.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], {
      type: contentType,
    });

    return { fileName, blob };
  };

  async downloadSummary(
    bounds: number[][],
    format: EXPORT_FORMAT
  ): Promise<any> {
    try {
      return await this.httpClient
        .post(
          `/api/map/summary?format=${format}&coordinates=${encodeURIComponent(
            JSON.stringify(bounds)
          )}`
        )
        .then(async (response) => {
          const { fileName, blob } = await this.getFileToDownload(response);

          // https://web.dev/browser-fs-access/
          const a = document.createElement('a');
          a.download = fileName;
          a.href = URL.createObjectURL(blob);
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
