import { type ProEligibilityTestWithAddresses } from '@/pages/api/pro-eligibility-tests/[id]';

type ColumnAccessor = (address: ProEligibilityTestWithAddresses['addresses'][number]) => string;

type CSVColumn = {
  header: string;
  description: string;
  accessor: ColumnAccessor;
  minWidth?: number; // Largeur minimale en caractères
};

const columns: CSVColumn[] = [
  {
    header: 'Adresse',
    description: 'Adresse reçue par France Chaleur Urbaine',
    accessor: (address) => address.source_address ?? '',
    minWidth: 50,
  },
  {
    header: 'Adresse testée',
    description: "Adresse testée par France Chaleur Urbaine (correspondance avec la Base d'adresse nationale)",
    accessor: (address) => address.ban_address ?? '',
    minWidth: 50,
  },
  {
    header: "Indice de fiabilité de l'adresse testée",
    description:
      "Min = 0 , Max = 1. Cet indice traduit la correspondance entre l'adresse renseignée par l'utilisateur et celle effectivement testée",
    accessor: (address) => `${address.ban_score ?? ''}`,
    minWidth: 40,
  },
  {
    header: 'Bâtiment potentiellement raccordable à un réseau existant',
    description:
      "Le bâtiment est jugé potentiellement raccordable s'il se situe à moins de 200 m d'un réseau existant, sauf sur Paris où ce seuil est réduit à 100 m. Attention, le mode de chauffage n'est pas pris en compte.",
    accessor: (address) =>
      address.eligibility_status?.isEligible && !address.eligibility_status?.futurNetwork
        ? 'Oui'
        : address.eligibility_status?.hasNoTraceNetwork
          ? 'A confirmer'
          : 'Non',
    minWidth: 60,
  },
  {
    header: 'Distance au réseau (m) si < 1000 m',
    description: 'Distance au réseau le plus proche, fournie uniquement si elle est de moins de 1000m',
    accessor: (address) => `${address.eligibility_status?.distance ?? ''}`,
    minWidth: 40,
  },
  {
    header: 'PDP (périmètre de développement prioritaire)',
    description:
      "Positif si l'adresse se situe dans le périmètre de développement prioritaire d'un réseau classé (d'après les données dont nous disposons). Une obligation de raccordement peut alors s'appliquer.",
    accessor: (address) => (address.eligibility_status?.inPDP ? 'Oui' : 'Non'),
    minWidth: 50,
  },
  {
    header: 'Bâtiment potentiellement raccordable à un réseau en construction',
    description:
      "Le bâtiment est situé à moins de 200 m du tracé d'un réseau en construction, ou situé dans une zone sur laquelle nous avons connaissance d'un réseau en construction ou en cours de mise en service",
    accessor: (address) => (address.eligibility_status?.isEligible && address.eligibility_status?.futurNetwork ? 'Oui' : 'Non'),
    minWidth: 70,
  },
  {
    header: 'Identifiant du réseau le plus proche',
    description: 'Identifiant réseau national',
    accessor: (address) => address.eligibility_status?.id ?? '',
    minWidth: 40,
  },
  {
    header: 'Taux EnR&R du réseau le plus proche',
    description: "Taux d'énergies renouvelables et de récupération issu de l'arrêté DPE du 16 mars 2023",
    accessor: (address) => `${address.eligibility_status?.tauxENRR ?? ''}`,
    minWidth: 40,
  },
  {
    header: 'Contenu CO2 ACV (g/kWh)',
    description: "Contenu CO2 en analyse du cycle de vie issu de l'arrêté DPE du 16 mars 2023",
    accessor: (address) => (address.eligibility_status?.co2 ? `${Math.round(address.eligibility_status.co2 * 1000)}` : ''),
    minWidth: 30,
  },
  {
    header: "Présence d'un réseau non localisé sur la commune",
    description: 'Un réseau existe dans cette commune, mais nous ne disposons pas de son tracé.',
    accessor: (address) => (address.eligibility_status?.hasNoTraceNetwork ? 'Oui' : 'Non'),
    minWidth: 50,
  },
];

const legend = [
  ...columns.map((col) => [col.header, col.description]),
  [],
  [
    'Mise en relation avec le gestionnaire',
    "Pour être mis en relation avec le gestionnaire d'un réseau pour obtenir plus d'informations, vous pouvez utiliser le formulaire en ligne sur notre site ou nous contacter par mail si le besoin concerne plusieurs adresses : france-chaleur-urbaine@developpement-durable.gouv.fr ",
  ],
];

export const getProEligibilityTestAsXlsx = async (addresses: ProEligibilityTestWithAddresses['addresses']) => {
  const XLSX = await import('xlsx');

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(
    [columns.map((col) => col.header)].concat(addresses.map((address) => columns.map((col) => col.accessor(address))))
  );

  // Définir les largeurs de colonnes pour la feuille de résultats
  ws['!cols'] = columns.map((col) => ({
    wch: col.minWidth, // wch = width in characters
  }));

  XLSX.utils.book_append_sheet(wb, ws, 'Résultats');

  const legendSheet = XLSX.utils.aoa_to_sheet(legend);
  legendSheet['!cols'] = [
    { wch: 50 }, // headers
    { wch: 100 }, // descriptions
  ];

  XLSX.utils.book_append_sheet(wb, legendSheet, 'Légende');
  return XLSX.write(wb, { type: 'buffer' });
};
