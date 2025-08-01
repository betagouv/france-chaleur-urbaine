import { type HeatNetworksResponse } from './HeatNetworksResponse';
import { type SuggestionItem } from './Suggestions';

export type AvailableHeating = 'collectif' | 'individuel' | undefined;
export type AvailableStructure = 'Tertiaire' | 'Copropriété' | 'Bailleur social' | 'Maison individuelle' | 'Autre' | undefined;
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
