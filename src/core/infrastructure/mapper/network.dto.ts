export type NetworkDistanceApiResponse = {
  msg: string;
  latOrigin: number;
  lonOrigin: number;
  latPointReseau: number;
  lonPointReseau: number;
  distPointReseau: number;
};
export type NetworkIrisResponse = {
  id: string;
  operateur: string;
  annee: number;
  code: any;
  filiere: string;
  code_grand_secteur: string;
  conso: string | number;
  pdl: any;
  code__1: any;
  operateur__1: string;
};
export type NetworkResponse = Partial<NetworkDistanceApiResponse> &
  Partial<NetworkIrisResponse>;
