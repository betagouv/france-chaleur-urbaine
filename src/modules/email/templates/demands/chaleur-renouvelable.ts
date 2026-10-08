import { type DemandeChaleurRenouvelable, typeLogementOptions, typeRadiateurOptions } from '@/modules/chaleur-renouvelable/constants';

export const getHousingTypeLabel = (value: string) => typeLogementOptions.find((option) => option.value === value)?.label ?? value;

export const getRadiatorTypeLabel = (value: DemandeChaleurRenouvelable['radiatorType']) =>
  value ? (typeRadiateurOptions.find((option) => option.value === value)?.label ?? value) : 'Non renseigné';

export const formatMwh = (value: number | null) =>
  value === null ? null : `${value.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} MWh`;

export const sampleRenewableHeatDemand = {
  address: '10 rue du Test, 75001 Paris',
  alternativeHeatingSolutions: ['PAC géothermique', 'Chaudière à bois', 'PAC air-eau collective'],
  annualHeatingConsumption: 820.5,
  averageArea: 70,
  averageResidents: 2,
  batimentConstructionId: 'CONSTRUCTION-123',
  comments: 'Le projet doit être traité avant la prochaine assemblée générale.',
  demandConcern: 'Une copropriété',
  dpe: 'C',
  email: 'claire.test@example.com',
  firstName: 'Claire',
  heatingEnergy: 'Gaz',
  hotWaterSystemType: 'Collectif',
  housingCount: 18,
  housingType: 'immeuble_chauffage_collectif',
  isPublicAdvisorSelected: false,
  lastName: 'Test',
  occupantStatus: 'Syndicat de copropriété',
  organizationName: 'Syndicat test',
  originDemandId: null,
  outdoorSpace: 'jardinCours',
  phone: '0605040302',
  projectStatus: ['Début de réflexion', 'Audit énergétique déjà réalisé'],
  radiatorType: 'radiateur-eau',
  refusalPeriod: 'Il y a moins de 3 mois',
  refusalReason: 'Coût du raccordement trop élevé',
  simulationUrl: 'https://france-chaleur-urbaine.beta.gouv.fr/chaleur-renouvelable/resultat',
  surfaceArea: null,
} satisfies DemandeChaleurRenouvelable;
