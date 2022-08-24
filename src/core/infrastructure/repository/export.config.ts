import { ExportColumn } from 'src/types/ExportColumn';
import { EnergySummary } from 'src/types/Summary/Energy';
import { GasSummary } from 'src/types/Summary/Gas';

export const consoColumns: ExportColumn<GasSummary>[] = [
  {
    header: 'Adresse',
    value: 'result_lab',
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
];

export const gasColumns: ExportColumn<EnergySummary>[] = [
  {
    header: 'Adresse',
    value: 'addr_label',
  },
];

export const fioulColumns: ExportColumn<EnergySummary>[] = [
  {
    header: 'Adresse',
    value: 'addr_label',
  },
];
