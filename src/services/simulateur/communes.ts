type Commune = {
  nom: string;
  codeInsee: string;
  codePostal: string;
  codeDepartement: string;
  altitudeMoyenne: number;
  temperatureRefAltitudeMoyenne: number;
};

export const communes: Commune[] = [
  {
    nom: 'AAST',
    codeInsee: '63107',
    codePostal: '64460',
    codeDepartement: '64',
    altitudeMoyenne: 382,
    temperatureRefAltitudeMoyenne: -6,
  },
  {
    nom: 'ABAINVILLE',
    codeInsee: '57629',
    codePostal: '55130',
    codeDepartement: '55',
    altitudeMoyenne: 323,
    temperatureRefAltitudeMoyenne: -13,
  },
];
