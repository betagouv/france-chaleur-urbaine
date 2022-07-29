import { ENERGY_USED } from '../enum/EnergyType';

export interface EnergySummary {
  id: number;
  adresse_reference: string;
  energie_utilisee: ENERGY_USED;
  nb_lot_habitation_bureau_commerce: number;
  periode_construction: string;
}
