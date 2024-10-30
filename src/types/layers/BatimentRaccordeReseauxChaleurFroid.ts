export type BatimentRaccordeReseauxChaleurFroid = {
  fid: number;
  id_reseau: string;
  filiere: 'C' | 'F';
  adresse?: string;
  code_grand_secteur: 'A' | 'I' | 'R' | 'T';
  conso?: number;
};
