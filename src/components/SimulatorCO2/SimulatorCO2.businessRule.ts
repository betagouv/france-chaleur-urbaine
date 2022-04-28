enum TypeSurf {
  copropriete = 'copropriete',
  tertiaire = 'tertiaire',
}

export enum TypeEnergy {
  fioul = 'fioul',
  gaz = 'gaz',
  rdc = 'rdc',
}

const equiLog = 10; // --> Consommation moyenne par logement et par an : consommation moyenne en MWh/an
const equiSurfLog = 140; // --> Consommation moyenne par m² de logement et par an : consommation moyenne en kWh/m2/an
const equiSurfTertiaire = 78; // --> Consommation moyenne par m² de surface tertiaire et par an : consommation moyenne en kWh/m2/an

export const dataEnergy = {
  [TypeEnergy.fioul]: {
    label: 'Fioul',
    eco2: 0.281,
  },
  [TypeEnergy.gaz]: {
    label: 'Gaz',
    eco2: 0.205,
  },
  [TypeEnergy.rdc]: {
    label: 'Réseau de chaleur',
    eco2: 0.101,
  },
};

export const getConso = (
  conso: number,
  log: number,
  surf: number,
  typeSurf: TypeSurf
): number | undefined => {
  if (conso) return conso;
  if (log) return log * equiLog;
  if (surf) {
    switch (typeSurf) {
      case TypeSurf.copropriete: {
        return (surf * equiSurfLog) / 1000;
      }
      case TypeSurf.tertiaire: {
        return (surf * equiSurfTertiaire) / 1000;
      }
    }
  }
};

// --> émission en tonnes CO2/an pour le type d'energie selectionnée :
export const getEmissionCO2 = (conso?: number, energy?: TypeEnergy): number =>
  conso && energy ? dataEnergy[energy].eco2 * conso : 0;

// --> économie en tonnes de CO2
export const getEconomy = (co2EnergyRef: number, co2Energy: number): number =>
  co2EnergyRef && co2Energy ? co2EnergyRef - co2Energy : 0;

export const getPercentGasReduct = (
  energyRef?: TypeEnergy,
  energy?: TypeEnergy
) =>
  energyRef && energy
    ? ((dataEnergy[energyRef].eco2 - dataEnergy[energy].eco2) /
        dataEnergy[energy].eco2) *
      100
    : 0;
