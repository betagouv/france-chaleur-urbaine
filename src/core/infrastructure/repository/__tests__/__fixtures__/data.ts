import { Address, Coords } from '@core/domain/entity/address';
import { AddressFactory } from '@core/domain/entity/AddressFactory';
import { Network } from '@core/domain/entity/network';
import { NetworkDistanceApiResponse } from '@core/infrastructure/mapper/network.dto';

export const aNetwork = (args?: Partial<Network>): Network => ({
  lat: 48,
  lon: 2.33,
  filiere: 'C',
  distance: 12,
  irisCode: null,
  ...args,
});

export const anIDFNetworkResponse = (
  args?: Partial<NetworkDistanceApiResponse>
): NetworkDistanceApiResponse => ({
  msg: 'Distance en metres',
  latOrigin: 48.868662,
  lonOrigin: 2.333382,
  latPointReseau: 48.86862979819023,
  lonPointReseau: 2.333218030067158,
  distPointReseau: 300,
  ...args,
});

export const anIDFNetwork = (args?: Partial<Network>): Network => ({
  lat: 48.86862979819023,
  lon: 2.333218030067158,
  distance: 300,
  filiere: null,
  irisCode: null,
  ...args,
});

export const anOutOfIDFAddress = (args?: Partial<Address>): Address =>
  AddressFactory.create({
    lat: 48.868662,
    lon: 2.333382,
    irisCode: '172500501',
    cityCode: '17250',
    label: '34 Avenue de l’Opéra 17250 Saint-sulpice d‘Arnoult',
    ...args,
  });

export const anIDFAddress = (args?: any): Address =>
  AddressFactory.create({
    lat: 48.868662,
    lon: 2.333382,
    irisCode: '7525000501',
    cityCode: '75250',
    label: '34 Avenue de l’Opéra 75002 Paris',
    ...args,
  });

export const someCoords = (args?: any): Coords => ({
  lat: 48.868662,
  lon: 2.333382,
  ...args,
});
