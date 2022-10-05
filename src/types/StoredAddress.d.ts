import { AddressDetail } from './HeatNetworksResponse';

export type StoredAddress = {
  id: string;
  coordinates: Point;
  address: string;
  addressDetails: AddressDetail;
  search: { date: number };
  contacted?: boolean;
};
