import { z } from 'zod';

import type { AdminDashboardThemeId } from '@/modules/admin/constants';

import type { IssueSeverity } from './types';

export const MAX_ITEMS_PER_ISSUE = 1000;

/** Network permissions from which an account without organization is a candidate for a national access. */
export const NATIONAL_CANDIDATE_MIN_NETWORKS = 50;

export const issueSeverityLabels = {
  error: 'Erreur',
  warning: 'Avertissement',
} as const satisfies Record<IssueSeverity, string>;

export const issueSeverityDsfr = {
  error: 'error',
  warning: 'warning',
} as const satisfies Record<IssueSeverity, 'error' | 'warning'>;

/**
 * Every data check, in display order of the product documentation: what it reports (title and description shown to the admins),
 * how serious (`error` = to fix, `warning` = to check), its theme (the tag of its line and its group in the documentation), and
 * whether it runs at every display of the dashboard or only on demand. Single source for the service, the dashboard and the documentation (`DashboardAlertsInventory`).
 */
export const diagnosticChecks = [
  {
    description:
      'Le réseau référencé n’existe plus en base. La demande n’a plus de gestionnaire effectif. Lancer `pnpm cli reseaux:reassign-orphan-demands` recalcule son éligibilité et la réaffecte (`--dry-run` pour seulement compter).',
    onDemand: false,
    severity: 'error',
    theme: 'networks',
    title: 'Demande affectée à un réseau supprimé',
    type: 'demand.orphan_network',
  },
  {
    description:
      'Ces PDP référencent un réseau (de chaleur, en construction, ou via l’identifiant SNCU) absent de la base. La résolution PDP → réseau échoue, donc les demandes situées dans ces PDP ne sont pas affectées au bon réseau.',
    onDemand: false,
    severity: 'error',
    theme: 'networks',
    title: 'PDP lié à un réseau inexistant',
    type: 'pdp.orphan_network',
  },
  {
    description:
      'Les réseaux liés à ces PDP portent des gestionnaires ou maîtres d’ouvrage différents : le remplissage automatique ne peut pas choisir. Saisir la valeur retenue dans Gestion des réseaux (onglet PDP).',
    onDemand: false,
    severity: 'error',
    theme: 'networks',
    title: 'PDP avec gestionnaire/MO à trancher',
    type: 'pdp.ambiguous_operator',
  },
  {
    description:
      'Une correction FCU (nom, gestionnaire, maître d’ouvrage) de ces réseaux diffère encore de la dernière enquête FEDENE. Pour chaque réseau, conserver la correction ou reprendre la valeur de l’enquête depuis la page Enquête FEDENE.',
    onDemand: false,
    severity: 'warning',
    theme: 'networks',
    title: 'Écart avec l’enquête FEDENE',
    type: 'network.survey_discrepancy',
  },
  {
    description:
      'Ces réseaux traversent le périmètre du PDP sans lui être liés : réseaux de chaleur classés et ouverts aux raccordements, réseaux ou zones en construction ouverts aux raccordements. Tant que le lien manque, la résolution PDP → réseau ignore ce réseau. Vérifier et ajouter le lien dans Gestion des réseaux (onglet PDP), ou corriger le périmètre.',
    onDemand: true,
    severity: 'warning',
    theme: 'networks',
    title: 'PDP traversé par un réseau non lié',
    type: 'pdp.missing_network_link',
  },
  {
    description:
      'Ces PDP sont liés à un réseau dont le tracé ne touche pas leur périmètre : lien erroné (par exemple deux PDP inversés), périmètre mal placé ou tracé incomplet. Vérifier le lien et les géométries dans Gestion des réseaux (onglet PDP).',
    onDemand: true,
    severity: 'warning',
    theme: 'networks',
    title: 'PDP lié à un réseau qui ne le traverse pas',
    type: 'pdp.link_without_intersection',
  },
  {
    description:
      'Le gestionnaire a posé un statut impliquant un contact avec le demandeur (« Recontacté pour étude » ou au-delà), mais le demandeur a répondu ensuite à l’enquête de satisfaction qu’il n’avait pas été recontacté. À vérifier auprès du gestionnaire.',
    onDemand: false,
    severity: 'warning',
    theme: 'managers',
    title: 'Demande prise en charge mais demandeur non recontacté',
    type: 'demand.recontact_mismatch',
  },
  {
    description:
      'Le demandeur a répondu qu’il n’avait pas été recontacté, mais cette réponse date d’avant la mise en place du suivi par événements et aucun vrai changement de statut n’est tracé : impossible de savoir si la prise en charge a eu lieu avant ou après. Données historiques à vérifier manuellement — cette liste ne peut que décroître.',
    onDemand: false,
    severity: 'warning',
    theme: 'managers',
    title: 'Demande prise en charge mais demandeur non recontacté (chronologie inconnue, données historiques)',
    type: 'demand.recontact_mismatch_legacy',
  },
  {
    description:
      'Une même valeur de « Gestionnaire » est rattachée à plusieurs organisations différentes. L’affectation réseau → organisation est incohérente : un opérateur ne devrait correspondre qu’à une seule organisation.',
    onDemand: false,
    severity: 'warning',
    theme: 'managers',
    title: 'Gestionnaire rattaché à plusieurs organisations',
    type: 'network.gestionnaire_split_across_organizations',
  },
  {
    description:
      'Ces organisations n’ont aucun réseau rattaché. Une éventuelle clé d’API donnerait accès à zéro demande. Rattacher des réseaux depuis l’écran d’administration de l’organisation, ou supprimer l’organisation.',
    onDemand: false,
    severity: 'warning',
    theme: 'managers',
    title: 'Organisation sans réseau rattaché',
    type: 'organization.without_networks',
  },
  {
    description:
      'Un gestionnaire ne doit porter que des permissions sur des réseaux. Les permissions territoriales (commune, EPCI, EPT, département, région) sont réservées aux collectivités, ALEC et CCRT.',
    onDemand: false,
    severity: 'error',
    theme: 'accounts',
    title: 'Gestionnaire avec une permission territoriale',
    type: 'user.gestionnaire_with_territory',
  },
  {
    description:
      'Les rôles admin, particulier et professionnel ne doivent jamais avoir de permissions attribuées. Ces lignes sont probablement des résidus à supprimer.',
    onDemand: false,
    severity: 'error',
    theme: 'accounts',
    title: 'Permission sur un rôle qui n’en porte pas',
    type: 'user.role_without_permissions_has_permission',
  },
  {
    description:
      'La recette de ces territoires référence un territoire qui ne correspond plus à aucune commune du référentiel (commune absorbée lors d’une fusion, EPCI ou EPT dissous). Une inclusion disparue retire des communes du territoire, une exclusion disparue en rajoute, sans aucun signal. Le recalcul ne corrige pas ce cas : modifier la recette pour remplacer ou retirer la référence.',
    onDemand: false,
    severity: 'error',
    theme: 'accounts',
    title: 'Territoire personnalisé dont la recette référence un territoire disparu',
    type: 'custom_territory.orphan_recipe_ref',
  },
  {
    description:
      'Ces utilisateurs ont un rôle qui suppose une portée (gestionnaire, collectivité, ALEC, CCRT) mais aucune permission attribuée. Ils ne voient aucune demande.',
    onDemand: false,
    severity: 'warning',
    theme: 'accounts',
    title: 'Compte actif sans aucune permission',
    type: 'user.no_permission',
  },
  {
    description: `Ces comptes actifs portent au moins ${NATIONAL_CANDIDATE_MIN_NETWORKS} permissions réseau énumérées et ne sont rattachés à aucune organisation. Ce sont des candidats à un accès national : créer/rattacher une organisation et remplacer ces permissions par une portée d’organisation.`,
    onDemand: false,
    severity: 'warning',
    theme: 'accounts',
    title: 'Candidat à un accès national non rattaché à une organisation',
    type: 'user.national_candidate_unmigrated',
  },
  {
    description:
      'La latitude ou la longitude est absente des données de la demande. La demande ne peut pas être affichée sur la carte et ne sera pas géoréférencée correctement.',
    onDemand: false,
    severity: 'error',
    theme: 'technical',
    title: 'Demande sans coordonnées GPS',
    type: 'demand.missing_coordinates',
  },
  {
    description:
      'Le réseau, la commune, l’EPCI, l’EPT, le département ou la région ciblé(e) n’existe plus en base. La permission ne donne plus accès à rien et doit être supprimée ou réaffectée.',
    onDemand: false,
    severity: 'error',
    theme: 'technical',
    title: 'Permission pointant vers une ressource supprimée',
    type: 'permission.orphan_resource',
  },
  {
    description:
      'Les communes enregistrées pour ces territoires ne correspondent plus à leur recette : le référentiel (communes IGN, EPT) a changé depuis leur dernier enregistrement. Les demandes des communes concernées ne sont pas rattachées au bon territoire. Lancer `pnpm cli custom-territories:refresh`.',
    onDemand: false,
    severity: 'error',
    theme: 'technical',
    title: 'Territoire personnalisé désynchronisé du référentiel',
    type: 'custom_territory.stale_communes',
  },
] as const satisfies readonly {
  description: string;
  onDemand: boolean;
  severity: IssueSeverity;
  theme: AdminDashboardThemeId;
  title: string;
  type: string;
}[];

export type DiagnosticCheckType = (typeof diagnosticChecks)[number]['type'];

export const zRunDataDiagnosticInput = z.object({ onDemand: z.boolean() });
export type RunDataDiagnosticInput = z.infer<typeof zRunDataDiagnosticInput>;
