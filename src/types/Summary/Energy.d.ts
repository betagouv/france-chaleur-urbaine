import { ENERGY_USED } from '../enum/EnergyType';

export interface EnergySummary {
  id: number;
  adresse_reference: string;
  energie_utilisee: ENERGY_USED;
  nb_logements: number;
  periode_construction?: string;
}
