import { ExportColumn } from '@/types/ExportColumn';
import { EnergySummary } from '@/types/Summary/Energy';
import { GasSummary } from '@/types/Summary/Gas';

export const consoColumns: ExportColumn<GasSummary>[] = [
  {
    header: 'Adresse',
    value: (conso) => `${conso.adresse} ${conso.nom_commun}`,
  },
  {
    header: 'Type',
    value: (conso: any) => {
      switch (conso.code_grand) {
        case 'R': {
          return 'Résidentiel';
        }
        case 'T': {
          return 'Tertiaire';
        }
        case 'I': {
          return 'Industrie';
        }
      }
      return '';
    },
  },
  {
    header: 'Consommation (MWh)',
    value: 'conso_nb',
  },
  {
    header: 'Points de livraison',
    value: 'pdl_nb',
  },
  {
    header: '<50m du réseau',
    value: (values) => (values.is_close ? 'Oui' : 'Non'),
  },
];

export const gasColumns: ExportColumn<EnergySummary>[] = [
  {
    header: 'Adresse',
    value: 'addr_label',
  },
  {
    header: '<50m du réseau',
    value: (values) => (values.is_close ? 'Oui' : 'Non'),
  },
  {
    header: 'Nombre de logements',
    value: 'nb_logements',
  },
];

export const fioulColumns: ExportColumn<EnergySummary>[] = [
  {
    header: 'Adresse',
    value: 'addr_label',
  },
  {
    header: '<50m du réseau',
    value: (values) => (values.is_close ? 'Oui' : 'Non'),
  },
  {
    header: 'Nombre de logements',
    value: 'nb_logements',
  },
];
