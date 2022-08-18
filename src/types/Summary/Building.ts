import { ENERGY_USED } from '../enum/EnergyType';

export interface BuildingSummary {
  id: number;
  nb_logements: number;
  annee_construction?: string;
  type_usage: string;
  energie_utilisee: ENERGY_USED;
  type_chauffage: string;
  addr_label: string;
  dpe_energie: string;
  dpe_ges: string;
}
