import { AxiosResponse } from 'axios';
import { HttpClient } from 'src/services/http';
import { HeatNetworksResponse } from 'src/types/HeatNetworksResponse';
import { Summary } from 'src/types/Summary';
import { Densite } from 'src/types/Summary/Densite';
import { EXPORT_FORMAT } from 'src/types/enum/ExportFormat';
import { ServiceError } from './errors';
import { SuggestionItem } from 'src/types/Suggestions';
import { Network } from 'src/types/Summary/Network';

export class HeatNetworkService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }
  async findByCoords(
    geoAddress: SuggestionItem
  ): Promise<HeatNetworksResponse> {
    try {
      if (geoAddress.properties.label === geoAddress.properties.city) {
        return await this.httpClient.get<HeatNetworksResponse>(
          `/api/map/cityNetwork?&city=${geoAddress.properties.city}`
        );
      } else {
        const [lon, lat] = geoAddress.geometry.coordinates;
        return await this.httpClient.get<HeatNetworksResponse>(
          `/api/map/eligibilityStatus?lat=${lat}&lon=${lon}&city=${geoAddress.properties.city}`
        );
      }
    } catch (e) {
      throw new ServiceError(e);
    }
  }

  async findByIdentifiant(identifiant: string): Promise<Network> {
    try {
      return await this.httpClient.get<Network>(
        `/api/map/network?&identifiant=${identifiant}`
      );
    } catch (e) {
      throw new ServiceError(e);
    }
  }

  async bulkEligibility(
    addresses: string,
    email: string
  ): Promise<{
    id: string;
    progress: number;
    result?: string;
    error?: boolean;
  }> {
    return this.httpClient
      .post('/api/map/bulkEligibilityStatus', { addresses, email })
      .then((response) => response.data);
  }

  async bulkEligibilityValues(id: string): Promise<{
    id: string;
    progress: number;
    result?: any[];
    error?: boolean;
  }> {
    return this.httpClient.get(`/api/map/bulkEligibilityStatus/${id}`);
  }

  async bulkEligibilityExport(id: string): Promise<string> {
    return this.httpClient
      .post(`/api/map/bulkEligibilityStatus/${id}`)
      .then((response) => response.data);
  }

  async densite(line: number[][][]): Promise<Densite> {
    try {
      return await this.httpClient.get<Densite>(
        `/api/map/summary?type=line&coordinates=${encodeURIComponent(
          JSON.stringify(line)
        )}`
      );
    } catch (e) {
      throw new ServiceError(e);
    }
  }

  async summary(bounds: number[][]): Promise<Summary> {
    try {
      return await this.httpClient.get<Summary>(
        `/api/map/summary?type=polygon&coordinates=${encodeURIComponent(
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
    const contentType = response.headers['content-type'];

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
          `/api/map/summary?type=polygon&format=${format}&coordinates=${encodeURIComponent(
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
