export class Network {
  constructor(
    public lat: number | null,
    public lon: number | null,
    public filiere: string | null,
    public distance: number | null,
    public irisCode: string | null
  ) {}
}

export const IsNetwork = (network: any): network is Network => {
  return !!network?.irisCode;
};
export const IsANullNetwork = (network: any): boolean => {
  return Object.keys(network).every((key) => network[key] === null);
};
