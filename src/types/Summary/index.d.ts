import { type EnergySummary } from './Energy';
import { type GasSummary } from './Gas';
import { type NetworkSummary } from './Network';

export interface Summary {
  gas: GasSummary[];
  energy: EnergySummary[];
  network: NetworkSummary[];
}
