import { ENERGY_USED } from '../enum/EnergyType';

export interface EnergySummary {
  id: number;
  addr_label: string;
  energie_utilisee: ENERGY_USED;
  nb_logements: number;
  annee_construction?: string;
}
