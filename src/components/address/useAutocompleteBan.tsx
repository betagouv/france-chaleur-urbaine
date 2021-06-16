import debounce from 'lodash.debounce';
import React from 'react';

const BAN_API_BASE_URL = 'https://api-adresse.data.gouv.fr/search/?q=';
const HEAT_NETWORK_API_BASE_URL =
  'https://chauffurbain.herokuapp.com/distance?';
export type SuggestionItem = {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: number[];
  };
  properties: {
    label: string;
    score: string;
    housenumber: string;
    id: string;
    type: string;
    name: string;
    postcode: string;
    citycode: string;
    x: number;
    y: number;
    city: string;
    context: string;
    importance: number;
    street: string;
  };
};

type SuggestionResponse = {
  type: 'FeatureCollection';
  version: string;
  features: SuggestionItem[];
  attribution: string;
  licence: string;
  query: string;
  limit: number;
};
export type Suggestion = SuggestionResponse['features'];

type HeatNetworksResponse = {
  msg: string;
  latOrigin: number;
  lonOrigin: number;
  latPointReseau: number;
  lonPointReseau: number;
  distPointReseau: number;
};
export type Coords = {
  lon: number;
  lat: number;
};
export class HeatNetworkService {
  httpClient: any;
  constructor(http: any) {
    this.httpClient = http;
  }
  async findByCoords({ lon, lat }: Coords): Promise<HeatNetworksResponse> {
    try {
      const res = await fetch(
        `${HEAT_NETWORK_API_BASE_URL}lat=${lat}&lon=${lon}`
      );
      return await res.json();
    } catch (e) {
      throw new Error(e);
    }
  }
}
export class SuggestionService {
  httpClient: any;
  constructor(http: any) {
    this.httpClient = http;
  }
  async fetchSuggestions(searchTerm: string): Promise<SuggestionResponse> {
    try {
      const res = await fetch(
        `${BAN_API_BASE_URL}${encodeURIComponent(
          searchTerm
        )}&limit=5&autocomplete=1`
      );
      return await res.json();
    } catch (e) {
      throw new Error(e);
    }
  }
}
type SuggestionServiceType = SuggestionService;

type ServiceContextProps = {
  suggestionService: SuggestionServiceType;
  heatNetworkService: HeatNetworkService;
};
export const ServicesContext = React.createContext<
  ServiceContextProps | undefined
>(undefined);

const useServices = () => {
  const services = React.useContext(ServicesContext);
  if (!services) {
    throw new Error('App must be wrapped in Provider');
  }
  return services;
};

export const useAutocompleteBan = (searchTerm: string) => {
  const [suggestions, setSuggestions] = React.useState<Suggestion | null | []>(
    null
  );
  const [status, setStatus] = React.useState('idle');
  const { suggestionService } = useServices();
  const debounceFetch = React.useCallback(
    debounce(async (query: string) => {
      setStatus('loading');
      try {
        const fetchedSuggestions = await suggestionService.fetchSuggestions(
          query
        );
        setSuggestions(fetchedSuggestions.features);
        setStatus('success');
      } catch (e) {
        setSuggestions([]);
        setStatus('error');
      }
    }, 1000),

    []
  );
  React.useEffect(() => {
    if (!searchTerm.trim()) return;
    debounceFetch(searchTerm.trim());
  }, [suggestionService, searchTerm, debounceFetch]);
  return { suggestions, status };
};

export default useAutocompleteBan;

export const useHeatNetworks = () => {
  const [status, setStatus] = React.useState('idle');
  const [isEligible, setIsEligible] = React.useState(false);
  const [nearNetwork, setNearNetwork] =
    React.useState<HeatNetworksResponse | null>(null);
  const { heatNetworkService } = useServices();
  const findNearHeatNetwork = React.useCallback(
    async (coords: Coords) => {
      setStatus('loading');
      try {
        const network = await heatNetworkService.findByCoords(coords);
        setStatus('success');
        setNearNetwork(network);
      } catch (e) {
        setStatus('error');
      }
    },
    [heatNetworkService]
  );
  const _isEligible = React.useMemo(() => {
    return !nearNetwork ? false : nearNetwork.distPointReseau <= 300;
  }, [nearNetwork]);
  return {
    findNearHeatNetwork,
    checkEligibility: async (arg: any) => {
      setIsEligible(true);
      return _isEligible;
    },
    isEligible,
    status,
  };
};
