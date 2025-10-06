import { clientConfig } from '@/client-config';
import type { RouterOutput } from '@/modules/trpc/client';

type ProEligibilityTestAddress = RouterOutput['proEligibilityTests']['get']['addresses'][number];

type ColumnAccessor = (address: ProEligibilityTestAddress) => string;

type CSVColumn = {
  header: string;
  description: string;
  accessor: ColumnAccessor;
  minWidth?: number; // Largeur minimale en caractères
};

const columns: CSVColumn[] = [
  {
    accessor: (address) => address.source_address ?? '',
    description: 'Adresse reçue par France Chaleur Urbaine',
    header: 'Adresse',
    minWidth: 50,
  },
  {
    accessor: (address) => address.ban_address ?? '',
    description: "Adresse testée par France Chaleur Urbaine (correspondance avec la Base d'adresse nationale)",
    header: 'Adresse testée',
    minWidth: 50,
  },
  {
    accessor: (address) => `${address.ban_score ?? ''}`,
    description:
      "Min = 0 , Max = 100. Cet indice traduit la correspondance entre l'adresse renseignée par l'utilisateur et celle effectivement testée",
    header: "Indice de fiabilité de l'adresse testée",
    minWidth: 40,
  },
  {
    accessor: (address) =>
      address.eligibility_status?.isEligible && !address.eligibility_status?.futurNetwork
        ? 'Oui'
        : address.eligibility_status?.hasNoTraceNetwork
          ? 'A confirmer'
          : 'Non',
    description:
      "Le bâtiment est jugé potentiellement raccordable s'il se situe à moins de 200 m d'un réseau existant, sauf sur Paris où ce seuil est réduit à 100 m. Attention, le mode de chauffage n'est pas pris en compte.",
    header: 'Bâtiment potentiellement raccordable à un réseau existant',
    minWidth: 60,
  },
  {
    accessor: (address) => `${address.eligibility_status?.distance ?? ''}`,
    description: 'Distance au réseau le plus proche, fournie uniquement si elle est de moins de 1000m',
    header: 'Distance au réseau (m) si < 1000 m',
    minWidth: 40,
  },
  {
    accessor: (address) => (address.eligibility_status?.inPDP ? 'Oui' : 'Non'),
    description:
      "Positif si l'adresse se situe dans le périmètre de développement prioritaire d'un réseau classé (d'après les données dont nous disposons). Une obligation de raccordement peut alors s'appliquer.",
    header: 'PDP (périmètre de développement prioritaire)',
    minWidth: 50,
  },
  {
    accessor: (address) => (address.eligibility_status?.isEligible && address.eligibility_status?.futurNetwork ? 'Oui' : 'Non'),
    description:
      "Le bâtiment est situé à moins de 200 m du tracé d'un réseau en construction, ou situé dans une zone sur laquelle nous avons connaissance d'un réseau en construction ou en cours de mise en service",
    header: 'Bâtiment potentiellement raccordable à un réseau en construction',
    minWidth: 70,
  },
  {
    accessor: (address) => address.eligibility_status?.id ?? '',
    description: 'Identifiant réseau national',
    header: 'Identifiant du réseau le plus proche',
    minWidth: 40,
  },
  {
    accessor: (address) => `${address.eligibility_status?.tauxENRR ?? ''}`,
    description: "Taux d'énergies renouvelables et de récupération issu de l'arrêté DPE du 11 avril 2025",
    header: 'Taux EnR&R du réseau le plus proche',
    minWidth: 40,
  },
  {
    accessor: (address) => (address.eligibility_status?.co2 ? `${Math.round(address.eligibility_status.co2 * 1000)}` : ''),
    description: "Contenu CO2 en analyse du cycle de vie issu de l'arrêté DPE du 11 avril 2025",
    header: 'Contenu CO2 ACV (g/kWh)',
    minWidth: 30,
  },
  {
    accessor: (address) => (address.eligibility_status?.hasNoTraceNetwork ? 'Oui' : 'Non'),
    description: 'Un réseau existe dans cette commune, mais nous ne disposons pas de son tracé.',
    header: "Présence d'un réseau non localisé sur la commune",
    minWidth: 50,
  },
];

const legend = [
  ...columns.map((col) => [col.header, col.description]),
  [],
  [
    'Mise en relation avec le gestionnaire',
    `Pour être mis en relation avec le gestionnaire d'un réseau pour obtenir plus d'informations, vous pouvez utiliser le formulaire en ligne sur notre site ou nous contacter par mail si le besoin concerne plusieurs adresses : ${clientConfig.contactEmail} `,
  ],
];

export const getProEligibilityTestAsXlsx = async (addresses: ProEligibilityTestAddress[]) => {
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
