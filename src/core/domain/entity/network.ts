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
