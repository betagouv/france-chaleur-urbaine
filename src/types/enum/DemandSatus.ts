// biome-ignore assist/source/useSortedKeys: workflow order, exposed as is by Object.values (partner API schema)
export const DEMANDE_STATUS = {
  TO_PROCESS: 'À traiter',
  UNREALISABLE: 'Non réalisable',
  RECONTACTED: 'Recontacté pour étude',
  COMMERCIAL_PROPOSAL: 'Proposition commerciale envoyée',
  VOTED: 'Voté en AG',
  WORK_IN_PROGRESS: 'Travaux en cours',
  DONE: 'Réalisé',
  ABANDONNED: 'Projet abandonné par le prospect',
} as const;
export type DEMANDE_STATUS = (typeof DEMANDE_STATUS)[keyof typeof DEMANDE_STATUS];

export type DemandStatus = DEMANDE_STATUS;
