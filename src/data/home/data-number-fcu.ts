import statistics from '@data/statistics';

const dataNumberFcu = {
  date: statistics.lastActu,
  data: [
    {
      value: '> 90',
      description: 'Partenariats effectifs ou en cours de montage avec des collectivités et exploitants',
    },
    {
      value: `> ${statistics.connection}`,
      description: 'Raccordements à l’étude',
    },
    {
      value: `> ${statistics.logements}`,
      description: 'Logements concernés',
    },
    {
      value: `~ ${statistics.CO2Tons}`,
      description: 'Tonnes de CO2 potentiellement économisées par an',
      type: 'orange-circle',
    },
  ],
  note: 'Par raccordements à l’étude, on désigne ceux pour lesquels une étude de faisabilité technico-économique est en cours au niveau du gestionnaire du réseau, ou a été transmise à la copropriété ou au bâtiment tertiaire. En copropriété, la proposition du gestionnaire de réseau devra ensuite être votée en AG avant que les travaux ne puissent démarrer.',
};

export default dataNumberFcu;
