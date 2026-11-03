import { z } from 'zod';

import type { DemandeChaleurRenouvelableStatus } from '@/modules/chaleur-renouvelable/constants';
import { DEMANDE_STATUS } from '@/types/enum/DemandSatus';

export const zRequestDemandTrackingInput = z.object({
  // normalized before the format check so a pasted address with spaces is accepted, and matched case-insensitively
  email: z.string().trim().toLowerCase().pipe(z.email('Veuillez saisir une adresse email valide')),
});
export type RequestDemandTrackingInput = z.infer<typeof zRequestDemandTrackingInput>;

/** Where the "Suivre ma demande" form is embedded (PostHog `source` of the generic form events). */
export type DemandTrackingFormSource = 'homepage' | 'page_suivi';

export const DEMAND_TRACKING_PAGE_PATH = '/suivre-ma-demande';

export const demandTrackingDemandTypes = ['raccordement', 'accompagnement'] as const;
export type DemandTrackingDemandType = (typeof demandTrackingDemandTypes)[number];

/** Open demands are listed first in the email, closed ones (done, not feasible, closed) last. */
export type DemandTrackingPhase = 'en_cours' | 'cloturee';

export type DemandTrackingStatusDisplay = {
  /** Public wording, never the internal status label. */
  label: string;
  explanation: string;
  phase: DemandTrackingPhase;
  /** Appends a link to the renewable heating simulator after the explanation. */
  showCompareSolutionsLink?: boolean;
};

const CLOSED_DEMAND_DISPLAY: DemandTrackingStatusDisplay = {
  explanation: "Cette demande a été clôturée. Si votre projet est toujours d'actualité, écrivez-nous via le formulaire de contact.",
  label: 'Demande clôturée',
  phase: 'cloturee',
};

/** Raccordement demand not yet validated by the FCU team (still "À traiter"): nothing has been sent to the manager yet. */
export const RACCORDEMENT_NOT_VALIDATED_DISPLAY: DemandTrackingStatusDisplay = {
  explanation:
    'Votre demande est bien enregistrée. Elle va être transmise au gestionnaire du réseau de chaleur, qui reviendra vers vous pour étudier votre projet.',
  label: 'En attente de prise en charge',
  phase: 'en_cours',
};

export const raccordementStatusDisplays: Record<DEMANDE_STATUS, DemandTrackingStatusDisplay> = {
  [DEMANDE_STATUS.TO_PROCESS]: {
    explanation:
      'Votre demande est bien enregistrée. Elle va être transmise au gestionnaire du réseau de chaleur, qui reviendra vers vous pour étudier votre projet. Si aucun gestionnaire de réseau n’est référencé à proximité de votre bâtiment, nous informerons l’éventuel futur gestionnaire si un réseau est créé à proximité de cette adresse.',
    label: 'En attente de prise en charge',
    phase: 'en_cours',
  },
  [DEMANDE_STATUS.RECONTACTED]: {
    explanation: 'Le gestionnaire du réseau a pris contact avec vous pour étudier la faisabilité du raccordement de votre bâtiment.',
    label: 'Prise en charge par le gestionnaire du réseau',
    phase: 'en_cours',
  },
  [DEMANDE_STATUS.COMMERCIAL_PROPOSAL]: {
    explanation:
      'Le gestionnaire du réseau vous a adressé une proposition de raccordement, qui pourra être présentée en assemblée générale.',
    label: 'Proposition de raccordement transmise',
    phase: 'en_cours',
  },
  [DEMANDE_STATUS.VOTED]: {
    explanation: 'Le raccordement de votre bâtiment a été voté en assemblée générale.',
    label: 'Raccordement voté en assemblée générale',
    phase: 'en_cours',
  },
  [DEMANDE_STATUS.WORK_IN_PROGRESS]: {
    explanation: 'Les travaux de raccordement de votre bâtiment sont en cours.',
    label: 'Travaux de raccordement en cours',
    phase: 'en_cours',
  },
  [DEMANDE_STATUS.DONE]: {
    explanation: 'Votre bâtiment est raccordé au réseau de chaleur.',
    label: 'Raccordement réalisé',
    phase: 'cloturee',
  },
  [DEMANDE_STATUS.UNREALISABLE]: {
    explanation:
      "Après étude, le gestionnaire n'a pas pu donner suite au raccordement de votre bâtiment. D'autres solutions de chauffage renouvelable peuvent convenir à votre immeuble :",
    label: 'Raccordement non envisageable à ce jour',
    phase: 'cloturee',
    showCompareSolutionsLink: true,
  },
  [DEMANDE_STATUS.ABANDONNED]: CLOSED_DEMAND_DISPLAY,
};

/**
 * Renewable heating (multi-ENR) support demands. The first three wordings come from the product
 * ticket; the others are provisional until the CCRT workspace ticket settles them.
 */
export const accompagnementStatusDisplays: Record<DemandeChaleurRenouvelableStatus, DemandTrackingStatusDisplay> = {
  'A traiter': {
    explanation:
      'Votre demande va être transmise au conseiller chaleur renouvelable de votre territoire. Ce conseiller du service public, neutre et gratuit, vous recontactera pour faire le point sur votre projet.',
    label: 'En attente de prise en charge',
    phase: 'en_cours',
  },
  'Etude d’opportunité en cours': {
    explanation: 'Votre conseiller chaleur renouvelable étudie les solutions de chauffage renouvelable adaptées à votre bâtiment.',
    label: "Étude d'opportunité en cours",
    phase: 'en_cours',
  },
  'Etude d’opportunité réalisée': {
    explanation: "L'étude d'opportunité de votre projet a été réalisée par votre conseiller chaleur renouvelable.",
    label: "Étude d'opportunité réalisée",
    phase: 'en_cours',
  },
  'Installation réalisée': {
    explanation: "L'installation de votre nouvelle solution de chauffage est réalisée.",
    label: 'Installation réalisée',
    phase: 'cloturee',
  },
  'Non pertinent': CLOSED_DEMAND_DISPLAY,
  'Premier conseil téléphonique réalisé': {
    explanation: 'Votre conseiller chaleur renouvelable vous a apporté un premier conseil par téléphone sur votre projet.',
    label: 'Premier conseil réalisé',
    phase: 'en_cours',
  },
  'Projet abandonné par le prospect': CLOSED_DEMAND_DISPLAY,
  'Recontacté pour premier échange': {
    explanation: 'Votre conseiller chaleur renouvelable a pris contact avec vous pour faire le point sur votre projet.',
    label: 'Prise en charge par votre conseiller chaleur renouvelable',
    phase: 'en_cours',
  },
  'Réorienté vers France Rénov’': {
    explanation:
      "Votre projet relève de l'accompagnement France Rénov’ : votre conseiller vous a orienté vers l'Espace Conseil France Rénov’ de votre territoire.",
    label: 'Demande réorientée vers France Rénov’',
    phase: 'cloturee',
  },
  'Étude de faisabilité votée en AG': {
    explanation: "Votre copropriété a voté en assemblée générale la réalisation d'une étude de faisabilité.",
    label: 'Étude de faisabilité votée en assemblée générale',
    phase: 'en_cours',
  },
};

/** One row of the "Où en est votre demande ?" email. */
export type DemandTrackingEmailRow = {
  address: string;
  type: DemandTrackingDemandType;
  status: DemandTrackingStatusDisplay;
};
