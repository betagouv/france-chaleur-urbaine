import { Demand } from 'src/types/Summary/Demand';

export const themeDefDemands: any = {
  fill: { color: '#FFFFFF', size: 4 },
  stroke: { color: '#FF7576', size: 2 },
};

export const displayModeDeChauffage = (demand: Demand) => {
  if (
    demand['Mode de chauffage'] &&
    (demand['Mode de chauffage'].toLowerCase().trim() === 'gaz' ||
      demand['Mode de chauffage'].toLowerCase().trim() === 'fioul' ||
      demand['Mode de chauffage'].toLowerCase() === 'électricité')
  ) {
    return `${demand['Mode de chauffage'][0].toUpperCase()}${demand['Mode de chauffage'].slice(1).trim()} ${
      demand['Type de chauffage'] ? demand['Type de chauffage'].toLowerCase() : ''
    }`;
  }
  return demand['Type de chauffage'];
};
