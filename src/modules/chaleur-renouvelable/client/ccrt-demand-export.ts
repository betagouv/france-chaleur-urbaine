import { dayjs } from '@/utils/date';
import type { ExportColumn } from '@/utils/export';

import { getEspaceExterieurLabel, modeEauChaudeSanitaireOptions, typeLogementOptions, typeRadiateurOptions } from '../constants';
import type { CcrtDemand } from '../types';

export const ccrtDemandExportColumns = [
  { accessorKey: 'id', name: 'N° de demande' },
  { accessorFn: (demand) => dayjs(demand.created_at).format('DD/MM/YYYY'), name: 'Date de la demande' },
  { accessorKey: 'first_name', name: 'Prénom' },
  { accessorKey: 'last_name', name: 'Nom' },
  { accessorKey: 'email', name: 'Email' },
  { accessorKey: 'phone', name: 'Téléphone' },
  { accessorKey: 'address', name: 'Adresse' },
  { accessorKey: 'status', name: 'Statut' },
  { accessorKey: 'project_state', name: 'État du projet' },
  {
    accessorFn: (demand) => typeLogementOptions.find((option) => option.value === demand.housing_type)?.label ?? demand.housing_type,
    name: 'Type de logement',
  },
  { accessorFn: (demand) => getEspaceExterieurLabel(demand.outdoor_space), name: 'Espace extérieur' },
  { accessorKey: 'dpe', name: 'DPE' },
  { accessorKey: 'heating_energy', name: 'Énergie' },
  { accessorKey: 'annual_heating_consumption', name: 'Consommations annuelles de chauffage (MWh)', precision: 2 },
  {
    accessorFn: (demand) =>
      modeEauChaudeSanitaireOptions.find((option) => option.value === demand.hot_water_system_type)?.label ?? 'Non renseigné',
    name: 'ECS',
  },
  {
    accessorFn: (demand) => typeRadiateurOptions.find((option) => option.value === demand.radiator_type)?.label ?? 'Non renseigné',
    name: 'Radiateurs',
  },
  { accessorKey: 'occupant_status', name: 'Statut occupant' },
  { accessorKey: 'project_status', name: 'Projet' },
  { accessorKey: 'alternative_heating_solutions', name: 'Solutions' },
  { accessorKey: 'comments', name: 'Commentaires' },
  { accessorKey: 'batiment_construction_id', name: 'Bâtiment' },
  { accessorKey: 'rnic_nom_copropriete', name: 'Copropriété RNIC' },
  { accessorKey: 'rnic_numero_immatriculation', name: 'Immatriculation RNIC' },
  { accessorKey: 'rnic_siret_representant_legal', name: 'SIRET représentant légal RNIC' },
  { accessorKey: 'housing_count', name: 'Logements' },
  { accessorKey: 'average_area', name: 'Surface moyenne (m²)', precision: 2 },
  { accessorKey: 'simulation_url', name: 'Simulation' },
] satisfies ExportColumn<CcrtDemand>[];
