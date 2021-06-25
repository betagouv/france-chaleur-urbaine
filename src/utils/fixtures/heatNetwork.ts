import { HeatNetworksResponse } from 'src/types';

export const someNearHeatNetwork = (): HeatNetworksResponse => ({
  msg: 'Distance en metres',
  latOrigin: 48.868662,
  lonOrigin: 2.333382,
  latPointReseau: 48.86862979819023,
  lonPointReseau: 2.333218030067158,
  distPointReseau: 12,
});

export const someRemoteHeatNetwork = (): HeatNetworksResponse => ({
  msg: 'Distance en metres',
  latOrigin: 48.867762,
  lonOrigin: 2.333382,
  latPointReseau: 48.79819023,
  lonPointReseau: 21.330067158,
  distPointReseau: 350,
});
