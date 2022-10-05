import { HeatNetworksResponse } from './HeatNetworksResponse';
import { Point } from './Point';
import { SuggestionItem } from './Suggestions';

export type AvailableHeating = 'collectif' | 'individuel' | undefined;
export type AvailableStructure = 'Tertiaire' | 'Copropriété' | undefined;
export type AddressDataType = {
  address?: string;
  coords?: Point;
  company?: string;
  geoAddress?: SuggestionItem;
  computedEligibility?: boolean;
  heatingType?: AvailableHeating;
  structure?: AvailableStructure;
  eligibility?: HeatNetworksResponse;
};
