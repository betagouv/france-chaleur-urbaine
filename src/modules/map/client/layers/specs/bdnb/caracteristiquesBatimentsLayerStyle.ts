/**
 * Palette de couleurs des classes DPE (A→G, plus N pour « non renseigné »).
 *
 * Fichier autonome, sans dépendance carte, pour pouvoir être importé par des
 * composants légers (ex. `DPE`) sans tirer la spec de couche bdnb — ce qui
 * créerait un cycle d'imports `bdnb/common` ↔ `caracteristiquesBatiments`.
 */
export const caracteristiquesBatimentsLayerStyle = {
  A: '#0D8A61',
  B: '#42A548',
  C: '#6CB36E',
  D: '#EBDE2D',
  E: '#E0A736',
  F: '#E66E31',
  G: '#C5171D',
  N: '#999999',
};
