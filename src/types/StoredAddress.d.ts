export type StoredAddress = {
  id: string;
  coordinates: Point;
  address: string;
  addressDetails: TypeAddressDetail;
  search: { date: number };
  contacted?: boolean;
};
