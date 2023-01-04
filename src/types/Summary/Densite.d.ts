import { GasSummary } from './Gas';

export type Densite = {
  size: number;
  data: { 10: GasSummary[]; 50: GasSummary[] };
};
