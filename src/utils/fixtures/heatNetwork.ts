import { HeatNetworksResponse } from 'src/types';

export const someNearHeatNetwork = (): HeatNetworksResponse => ({
  lat: 48.867762,
  lon: 2.333382,
  network: {
    lat: 48.79819023,
    lon: 21.330067158,
    irisCode: null,
    filiere: null,
    distance: 12,
  },
  isEligible: true,
});

export const someRemoteHeatNetwork = (): HeatNetworksResponse => ({
  lat: 48.867762,
  lon: 2.333382,
  network: {
    lat: null,
    lon: null,
    irisCode: null,
    filiere: null,
    distance: null,
  },
  isEligible: false,
});
