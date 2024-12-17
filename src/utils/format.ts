/**
 * Ajoute les accents pour les modes de chauffage
 * Les données proviennent de la colonne dpe_mix_arrete_type_energie_chauffage de la BDNB.
 * @param v
 * @returns
 */
export function formatTypeEnergieChauffage(v: string) {
  return v.replace(/electricite/g, 'électricité').replace(/reseau/g, 'réseau');
}
