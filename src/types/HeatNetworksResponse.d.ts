export interface HeatNetworksResponse {
  lat: number;
  lon: number;
  network: {
    lat: number | null;
    lon: number | null;
    irisCode: string | number | null;
    filiere: string | null;
    distance: number | null;
  };
  isEligible: boolean;
}
