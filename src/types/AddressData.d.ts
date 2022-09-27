export type AvailableHeating = 'collectif' | 'individuel' | undefined;
export type AvailableStructure = 'Tertiaire' | 'Copropriété' | undefined;
export type AddressDataType = {
  address?: string;
  company?: string;
  geoAddress?: Record<string, any>;
  eligibility?: boolean;
  computEligibility?: boolean;
  heatingType?: AvailableHeating;
  network?: Record<string, any>;
  structure?: AvailableStructure;
  distance?: number;
};
