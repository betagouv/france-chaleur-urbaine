import { ENERGY_USED } from '../enum/EnergyType';

export interface EnergySummary {
  id: number;
  addr_label: string;
  addr_numero: string;
  addr_voie: string;
  addr_cp: string;
  addr_ville: string;
  addr_insee: string;
  energie_utilisee: ENERGY_USED;
  nb_logements: number;
  periode_construction?: string;
}
