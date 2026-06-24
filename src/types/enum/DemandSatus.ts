export enum DEMANDE_STATUS {
  TO_PROCESS = 'À traiter',
  UNREALISABLE = 'Non réalisable',
  RECONTACTED = 'Recontacté pour étude',
  COMMERCIAL_PROPOSAL = 'Proposition commerciale envoyée',
  VOTED = 'Voté en AG',
  WORK_IN_PROGRESS = 'Travaux en cours',
  DONE = 'Réalisé',
  ABANDONNED = 'Projet abandonné par le prospect',
}

export type DemandStatus = DEMANDE_STATUS;
