import { EnergySummary } from './Energy';
import { GasSummary } from './Gas';
import { NetworkSummary } from './Network';

export interface Summary {
  gas: GasSummary[];
  energy: EnergySummary[];
  network: NetworkSummary[];
  closeGas: GasSummary[];
  closeEnergy: EnergySummary[];
}
