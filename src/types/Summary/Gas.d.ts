export interface GasSummary {
  adresse?: string;
  nom_commun?: string;
  code_grand?: 'R' | 'T' | 'I';
  conso_nb: number;
  pdl_nb: number;
  is_close: boolean;
}
