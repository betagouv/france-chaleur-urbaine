/**
 * Single source of truth for the numeric business thresholds and delays.
 *
 * Production code imports `.value` from here; the admin documentation renders the
 * same entries via `<Rule id="…" />` (src/modules/doc/client/Rule.tsx). A number
 * only belongs here if its production definition reads it from this file — that is
 * what guarantees the documentation and the code can never disagree.
 *
 * Client-safe (no imports): usable from both client and server code.
 */
export type BusinessRule = {
  /** Raw numeric value, imported by production code. */
  value: number;
  /** Formatted value shown in the documentation, e.g. "500 m". */
  display: string;
  /** Short French label. */
  label: string;
  /** One-line French description. */
  description: string;
};

export const businessRules = {
  autoAssignMaxDistance: {
    description: "Au-delà, une demande n'est pas affectée automatiquement au réseau le plus proche.",
    display: '500 m',
    label: "Distance d'affectation automatique",
    value: 500,
  },
  batchDemandMaxAddresses: {
    description: "Nombre maximal d'adresses par envoi de demandes groupées.",
    display: '50 adresses',
    label: 'Demandes groupées : maximum',
    value: 50,
  },
  comparateurNetworkSearchRadiusMeters: {
    description: "Distance maximale à laquelle le comparateur recherche un réseau autour de l'adresse saisie.",
    display: '1 km',
    label: 'Rayon de recherche réseau (comparateur)',
    value: 1000,
  },
  conversionIpRetentionDays: {
    description: 'Durée de conservation des IP et user-agents des événements de conversion (anti-abus) avant effacement.',
    display: '90 jours',
    label: 'Rétention des IP de conversion',
    value: 90,
  },
  demandDedupWindowDays: {
    description: 'Fenêtre pendant laquelle une demande identique (même email et même adresse) ne recrée pas de demande.',
    display: '30 jours',
    label: 'Déduplication des demandes',
    value: 30,
  },
  eligibilityMaxDisplayDistance: {
    description: "Au-delà, la distance n'est plus affichée et l'adresse est considérée « trop éloignée ».",
    display: '1 000 m',
    label: "Distance d'affichage maximale",
    value: 1000,
  },
  eligibilityRecomputeBufferMeters: {
    description: "Autour d'un tracé modifié, rayon dans lequel les adresses des tests en masse sont recalculées.",
    display: '1 km',
    label: "Rayon de recalcul d'éligibilité",
    value: 1000,
  },
  eligibilityTransitionThresholdMeters: {
    description:
      "Variation de distance au réseau à partir de laquelle un changement d'éligibilité (rapprochement / éloignement) est considéré comme significatif.",
    display: '50 m',
    label: "Seuil de changement d'éligibilité",
    value: 50,
  },
  eligibleDistanceDefault: {
    description: "Distance maximale au réseau pour qu'une adresse soit considérée proche (éligible), hors réseaux parisiens.",
    display: '200 m',
    label: "Distance d'éligibilité (hors Paris)",
    value: 200,
  },
  eligibleDistanceParis: {
    description: "Seuil d'éligibilité réduit pour les réseaux parisiens (CPCU).",
    display: '100 m',
    label: "Distance d'éligibilité (Paris)",
    value: 100,
  },
  fcrHeatNetworkMaxDistanceMeters: {
    description:
      'Distance maximale au réseau pour que le raccordement soit proposé comme solution dans le simulateur chaleur renouvelable.',
    display: '200 m',
    label: 'Chaleur renouvelable : distance réseau maximale',
    value: 200,
  },
  fcrSolarThermalMinCoveragePercent: {
    description:
      "Taux de couverture des besoins d'eau chaude sanitaire à partir duquel le solaire thermique est jugé suffisant dans le simulateur chaleur renouvelable.",
    display: '80 %',
    label: 'Chaleur renouvelable : couverture solaire minimale',
    value: 80,
  },
  fileUploadMaxSizeMB: {
    description: "Taille maximale d'un fichier importé pour un test d'adresses en masse.",
    display: '50 Mo',
    label: 'Taille de fichier maximale',
    value: 50,
  },
  firstRelanceDelayMonths: {
    description: 'Délai après le dépôt avant la première relance de satisfaction du demandeur.',
    display: '1 mois',
    label: 'Première relance du demandeur',
    value: 1,
  },
  highEnrrFilterPercent: {
    description: "Taux d'EnR&R minimal du filtre rapide « réseaux les plus vertueux » des tests d'adresses.",
    display: '50 %',
    label: 'Filtre EnR&R élevé : seuil',
    value: 50,
  },
  maxPermissionsPerUser: {
    description: 'Nombre maximal de permissions attribuables à un même compte.',
    display: '400 permissions',
    label: 'Permissions par compte : maximum',
    value: 400,
  },
  nearNetworkFilterDistanceMeters: {
    description: "Distance maximale au réseau du filtre rapide « adresses proches d'un réseau » des tests d'adresses.",
    display: '100 m',
    label: 'Filtre « proche réseau » : distance',
    value: 100,
  },
  passwordResetTokenValidityHours: {
    description: 'Durée de validité du lien « Mot de passe oublié ».',
    display: '3 heures',
    label: 'Validité du lien de réinitialisation',
    value: 3,
  },
  secondRelanceDelayDays: {
    description: 'Délai après le dépôt avant la seconde relance de satisfaction du demandeur.',
    display: '45 jours',
    label: 'Seconde relance du demandeur',
    value: 45,
  },
  unhandledDemandReminderDays: {
    description: "Ancienneté d'une demande « À traiter » (depuis sa notification) déclenchant le rappel au gestionnaire.",
    display: '7 jours',
    label: 'Rappel des demandes en attente',
    value: 7,
  },
  veryEligibleDistanceDefault: {
    description: "En dessous, l'adresse est très proche d'un réseau : le cas le plus favorable.",
    display: '100 m',
    label: 'Distance « très proche » (hors Paris)',
    value: 100,
  },
  veryEligibleDistanceParis: {
    description: 'Seuil « très proche » réduit pour les réseaux parisiens (CPCU).',
    display: '60 m',
    label: 'Distance « très proche » (Paris)',
    value: 60,
  },
} satisfies Record<string, BusinessRule>;

export type BusinessRuleId = keyof typeof businessRules;
