import { Address, Coords } from '@core/domain/entity/address';
import { createAddress } from '@core/domain/entity/AddressFactory';
import { Network } from '@core/domain/entity/network';
import { AddressPyrisResponse } from '@core/infrastructure/mapper/address.dto';
import { NetworkDistance } from '@core/infrastructure/mapper/network.dto';

export const THRESHOLD = parseInt(process.env.NEXT_THRESHOLD || '0', 10);

export const someNetwork = (args?: Partial<Network>): Network => ({
  lat: 48,
  lon: 2.33,
  filiere: 'C',
  distance: 12,
  irisCode: null,
  ...args,
});

export const anIDFNetworkResponse = (
  args?: Partial<NetworkDistance>
): NetworkDistance => ({
  msg: 'Distance en metres',
  latOrigin: 48.868662,
  lonOrigin: 2.333382,
  latPointReseau: 48.86862979819023,
  lonPointReseau: 2.333218030067158,
  distPointReseau: THRESHOLD,
  ...args,
});

export const anIDFNetwork = (args?: Partial<Network>): Network => ({
  lat: 48.86862979819023,
  lon: 2.333218030067158,
  distance: THRESHOLD,
  filiere: null,
  irisCode: null,
  ...args,
});

export const anOutOfIDFAddress = (args?: Partial<Address>): Address =>
  createAddress({
    lat: 48.868662,
    lon: 2.333382,
    irisCode: '172500501',
    cityCode: '17250',
    city: 'Saint-sulpice d‘Arnoult',
    label: '34 Avenue de l’Opéra 17250 Saint-sulpice d‘Arnoult',
    ...args,
  });

export const anIDFAddress = (args?: any): Address =>
  createAddress({
    lat: 48.868662,
    lon: 2.333382,
    irisCode: '7525000501',
    cityCode: '75250',
    city: 'Paris',
    label: '34 Avenue de l’Opéra 75002 Paris',
    ...args,
  });

export const anAddressNotFound = (args?: any): Address =>
  createAddress({
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

export const someOutOfIDFCoordsWithNoNetwork = (args?: any): Coords => ({
  lat: 48.838201,
  lon: -1.594692,
  ...args,
});

export const someAddress = (): string => '5 avenue ségur, 75017 Paris';

export const somePyrisAddressResponse = (args?: any): AddressPyrisResponse => ({
  city: 'Paris 2e Arrondissement',
  name: 'Gaillon 1',
  complete_code: '751020501',
  iris: '0501',
  citycode: '75102',
  type: 'A',
  ...args,
});

export const somePyrisAddressOutOfIDFResponse = (
  args?: any
): AddressPyrisResponse => ({
  city: 'Granville',
  lat: 48.838201,
  lon: -1.594692,
  name: 'Quartier du Lude et du Rocher',
  complete_code: '502180102',
  iris: '0102',
  citycode: '50218',
  type: 'H',
  address: '3 Rue du Boscq 50400 Granville',
  ...args,
});

export const someEligiblePyrisAddressOutOfIDFResponse = (
  args?: any
): AddressPyrisResponse => ({
  city: 'Bayonne',
  lat: 43.50142,
  lon: -1.45507,
  name: 'Hauts-de-Sainte-Croix',
  complete_code: '641021001',
  iris: '1001',
  citycode: '64102',
  type: 'H',
  address: '2 Esplanade Jouandin 64100 Bayonne',
  ...args,
});

export const someNotFoundNetworkResponse = (
  args?: Partial<NetworkDistance>
): NetworkDistance => ({
  msg: 'Distance en metres',
  latOrigin: null,
  lonOrigin: 0,
  latPointReseau: 0,
  lonPointReseau: 0,
  distPointReseau: 100000000,
  ...args,
});

THRESHOLD;
export const someIDFNetworkLessThanThresholdDistanceResponse = (
  args?: Partial<NetworkDistance>
): NetworkDistance => ({
  msg: 'Distance en metres',
  latOrigin: 48.868662,
  lonOrigin: 2.333382,
  latPointReseau: 48.86862979819023,
  lonPointReseau: 2.333218030067158,
  distPointReseau: 30,
  ...args,
});
