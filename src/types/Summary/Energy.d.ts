import { ENERGY_USED } from '../enum/EnergyType';

export interface EnergySummary {
  id: number;
  addr_label: string;
  energie_utilisee: ENERGY_USED;
  dpe_energie: string;
  dpe_ges: string;
  nb_logements: number;
  annee_construction?: string;
  is_close: boolean;
  type_usage: string;
  type_chauffage: string;
}
