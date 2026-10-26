import { kdb } from '@/server/db/kysely';

export const selectDemandesChaleurRenouvelableForList = () =>
  kdb
    .selectFrom('demands_chaleur_renouvelable')
    .select([
      'address',
      'alternative_heating_solutions',
      'annual_heating_consumption',
      'assigned_to',
      'average_area',
      'average_residents',
      'batiment_construction_id',
      'comments',
      'commune_code',
      'epci_code',
      'ept_code',
      'region_code',
      'origin_demand_id',
      'created_at',
      'demand_concern',
      'departement_code',
      'dpe',
      'email',
      'first_name',
      'heating_energy',
      'hot_water_system_type',
      'housing_count',
      'housing_type',
      'id',
      'is_public_advisor_selected',
      'last_name',
      'occupant_status',
      'outdoor_space',
      'organization_name',
      'phone',
      'project_state',
      'project_status',
      'radiator_type',
      'refusal_period',
      'refusal_reason',
      'rnic_nom_copropriete',
      'rnic_numero_immatriculation',
      'rnic_siret_representant_legal',
      'simulation_url',
      'status',
      'surface_area',
      'updated_at',
      'validated',
    ]);

export const serializeDemandesChaleurRenouvelable = <T extends { created_at: Date; updated_at: Date }>(demandes: T[]) =>
  demandes.map(({ created_at, updated_at, ...demande }) => ({
    ...demande,
    created_at: created_at.toISOString(),
    updated_at: updated_at.toISOString(),
  }));
