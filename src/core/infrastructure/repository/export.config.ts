import { ExportColumn } from 'src/types/ExportColumn';
import { EnergySummary } from 'src/types/Summary/Energy';
import { GasSummary } from 'src/types/Summary/Gas';

export const consoColumns: ExportColumn<GasSummary>[] = [
  {
    header: 'Adresse',
    value: 'result_label',
  },
  {
    header: 'Type',
    value: (conso: any) =>
      conso.code_grand_secteur === 'R' ? 'Résidentiel' : 'Tertiaire',
  },
  {
    header: 'Consommation (MWh)',
    value: 'conso',
  },
  {
    header: 'Points de livraison',
    value: 'pdl',
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
