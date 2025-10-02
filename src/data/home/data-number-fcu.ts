import statistics from '@/data/statistics';

const dataNumberFcu = {
  data: [
    {
      description: 'Partenariats effectifs ou en cours de montage avec des collectivités et exploitants',
      value: '> 90',
    },
    {
      description: 'Raccordements à l’étude',
      value: `> ${statistics.connection}`,
    },
    {
      description: 'Logements concernés',
      value: `> ${statistics.logements}`,
    },
    {
      description: 'Tonnes de CO2 potentiellement économisées par an',
      type: 'orange-circle',
      value: `~ ${statistics.CO2Tons}`,
    },
  ],
  date: statistics.lastActu,
  note: 'Par raccordements à l’étude, on désigne ceux pour lesquels une étude de faisabilité technico-économique est en cours au niveau du gestionnaire du réseau, ou a été transmise à la copropriété ou au bâtiment tertiaire. En copropriété, la proposition du gestionnaire de réseau devra ensuite être votée en AG avant que les travaux ne puissent démarrer.',
};

export default dataNumberFcu;
