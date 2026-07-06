import type { AvailableHeating } from '@/modules/app/types';
import type { BANAddressFeature } from '@/modules/ban/types';
import type { availableStructures } from '@/modules/demands/constants';

import type { HeatNetworksResponse } from './HeatNetworksResponse';

export type AvailableStructure = (typeof availableStructures)[number] | undefined;
export type AddressDataType = {
  address?: string;
  coords?: { lat: number; lon: number };
  company?: string;
  companyType?: string;
  geoAddress?: BANAddressFeature;
  computedEligibility?: boolean;
  heatingType?: AvailableHeating;
  structure?: AvailableStructure;
  eligibility?: HeatNetworksResponse;
  demandId?: string;
  nbLogements?: number;
  demandCompanyType?: string;
  demandCompanyName?: string;
  demandArea?: number;
};
