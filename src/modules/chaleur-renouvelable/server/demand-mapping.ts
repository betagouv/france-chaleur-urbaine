import type { CreateDemandInput } from '@/modules/demands/constants';

import type { DemandeChaleurRenouvelable } from '../constants';

export const getDemandHeatingEnergy = (heatingEnergy: DemandeChaleurRenouvelable['heatingEnergy']): CreateDemandInput['heatingEnergy'] => {
  switch (heatingEnergy) {
    case 'Électricité':
      return 'électricité';
    case 'Gaz':
      return 'gaz';
    case 'Fioul':
      return 'fioul';
    default:
      return 'autre';
  }
};

export const getDemandHeatingType = (housingType: DemandeChaleurRenouvelable['housingType']): CreateDemandInput['heatingType'] =>
  housingType === 'immeuble_chauffage_collectif' ? 'collectif' : 'individuel';

export const getDemandStructure = (
  input: Pick<DemandeChaleurRenouvelable, 'demandConcern' | 'occupantStatus'>
): Pick<CreateDemandInput, 'companyType' | 'demandCompanyType' | 'structure'> => {
  if (input.demandConcern === 'Une maison individuelle' || input.occupantStatus === 'Propriétaire de maison individuelle') {
    return { companyType: '', demandCompanyType: '', structure: 'Maison individuelle' };
  }

  if (input.occupantStatus === 'Bailleur social') {
    return { companyType: '', demandCompanyType: '', structure: 'Bailleur social' };
  }

  if (input.occupantStatus === 'Copropriétaire' || input.occupantStatus === 'Syndicat de copropriété') {
    return { companyType: 'Syndic de copropriété', demandCompanyType: '', structure: 'Copropriété' };
  }

  if (input.occupantStatus === "Bureau d'étude ou AMO") {
    return {
      companyType: "Bureau d'études ou AMO",
      demandCompanyType: getDemandCompanyType(input.demandConcern),
      structure: 'Tertiaire',
    };
  }

  if (input.occupantStatus === 'Mandataire ou Délégataire CEE') {
    return {
      companyType: 'Mandataire / délégataire CEE',
      demandCompanyType: getDemandCompanyType(input.demandConcern),
      structure: 'Tertiaire',
    };
  }

  return { companyType: input.occupantStatus, demandCompanyType: '', structure: 'Tertiaire' };
};

const getDemandCompanyType = (demandConcern: DemandeChaleurRenouvelable['demandConcern']) => {
  switch (demandConcern) {
    case 'Une copropriété':
      return 'Copropriété';
    case 'Une maison individuelle':
      return 'Maison individuelle';
    case 'Un bâtiment tertiaire':
      return 'Bâtiment tertiaire';
    case 'Plusieurs bâtiments':
      return 'Autre';
    default:
      return '';
  }
};
