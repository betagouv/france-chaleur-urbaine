export type AddressDTO = {
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
};

export type AddressPyrisResponse = {
  city: string;
  lat: number;
  lon: number;
  name: string;
  complete_code: string;
  iris: string;
  citycode: string;
  type: string;
  address: string;
};
