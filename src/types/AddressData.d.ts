import { HeatNetworksResponse } from './HeatNetworksResponse';
import { SuggestionItem } from './Suggestions';

export type AvailableHeating = 'collectif' | 'individuel' | undefined;
export type AvailableStructure = 'Tertiaire' | 'Copropriété' | undefined;
export type AddressDataType = {
  address?: string;
  coords?: { lat: number; lon: number };
  company?: string;
  companyType?: string;
  geoAddress?: SuggestionItem;
  computedEligibility?: boolean;
  heatingType?: AvailableHeating;
  structure?: AvailableStructure;
  eligibility?: HeatNetworksResponse;
  airtableId?: string;
  nbLogements?: number;
  demandCompanyType?: string;
  demandCompanyName?: string;
  demandArea?: number;
};
