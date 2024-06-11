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
  {
    nom: 'LILLE',
    codeInsee: '22163',
    codePostal: '59000/59160/59260/59777/59800',
    codeDepartement: '59',
    altitudeMoyenne: 27,
    temperatureRefAltitudeMoyenne: -9,
  },
  {
    nom: 'TOULOUSE',
    codeInsee: '62082',
    codePostal: '31000/31100/31200/31300/31400/31500',
    codeDepartement: '31',
    altitudeMoyenne: 148,
    temperatureRefAltitudeMoyenne: -5,
  },
];
