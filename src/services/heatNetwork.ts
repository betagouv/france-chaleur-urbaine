import type { NetworkEligibilityStatus } from '@/server/services/addresseInformation';
import type { HttpClient } from '@/services/http';
import type { HeatNetworksResponse } from '@/types/HeatNetworksResponse';
import type { SuggestionItem } from '@/types/Suggestions';

import { ServiceError } from './errors';

export const gestionnairesFilters = [
  {
    label: 'Coriance',
    value: 'coriance',
  },
  { label: 'Dalkia', value: 'dalkia' },
  { label: 'ENGIE Solutions', value: 'engie' },
  { label: 'IDEX', value: 'idex' },
  { label: 'Autre', value: 'autre' },
];

export class HeatNetworkService {
  httpClient: HttpClient;
  constructor(http: HttpClient) {
    this.httpClient = http;
  }

  async getNetworkEligibilityStatus(networkId: string, geoAddress: SuggestionItem): Promise<NetworkEligibilityStatus> {
    const [lon, lat] = geoAddress.geometry.coordinates;
    return await this.httpClient.get<NetworkEligibilityStatus>(`/api/networks/${networkId}/eligibility?lat=${lat}&lon=${lon}`);
  }

  async findByCoords(geoAddress: SuggestionItem): Promise<HeatNetworksResponse> {
    try {
      if (geoAddress.properties.label === geoAddress.properties.city) {
        return await this.httpClient.get<HeatNetworksResponse>(`/api/map/cityNetwork?&city=${geoAddress.properties.city}`);
      } else {
        const [lon, lat] = geoAddress.geometry.coordinates;
        const heatNetwork: HeatNetworksResponse = await this.httpClient.get<HeatNetworksResponse>(
          `/api/map/eligibilityStatus?lat=${lat}&lon=${lon}&city=${geoAddress.properties.city}`
        );
        return heatNetwork;
      }
    } catch (e) {
      throw new ServiceError(e);
    }
  }

  async bulkEligibilityValues(id: string): Promise<{
    id: string;
    progress: number;
    result?: any[];
    error?: boolean;
  }> {
    return this.httpClient.get(`/api/map/bulkEligibilityStatus/${id}`);
  }
}
