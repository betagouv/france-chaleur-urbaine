import { businessRules } from '@/modules/app/business-rules';
import type {
  ModeEauChaudeSanitaire,
  PrerequisiteRow,
  PrerequisiteStatus,
  Situation,
  TypeRadiateur,
} from '@/modules/chaleur-renouvelable/constants';

export const HEAT_NETWORK_MAX_DISTANCE = businessRules.fcrHeatNetworkMaxDistanceMeters.value;
export const SOLAR_THERMAL_MIN_COVERAGE = businessRules.fcrSolarThermalMinCoveragePercent.value;

export const hasEspaceShared = (situation: Situation) => ['shared', 'both'].includes(situation.espaceExterieur);

export const hasEspacePrivate = (situation: Situation) =>
  ['private', 'both', 'terrasseBalcon', 'jardinCours', 'terrasseBalconEtJardinCours'].includes(situation.espaceExterieur);

export const hasEspaceForHouseEquipment = (situation: Situation) =>
  ['shared', 'both', 'jardinCours', 'terrasseBalconEtJardinCours'].includes(situation.espaceExterieur);

export const hasCompatibleHotWaterMode = (situation: Situation, modes: ModeEauChaudeSanitaire[]) =>
  !situation.modeEauChaudeSanitaire ||
  situation.modeEauChaudeSanitaire === 'nonRenseigne' ||
  modes.some((modeEauChaudeSanitaire) => modeEauChaudeSanitaire === situation.modeEauChaudeSanitaire);

export const hasCompatibleRadiator = (situation: Situation, radiators: TypeRadiateur[]) =>
  situation.typeRadiateur ? radiators.includes(situation.typeRadiateur) : false;

export const isNearHeatNetwork = (situation: Situation) =>
  (situation.eligibiliteReseauChaleur?.distance ?? Number.POSITIVE_INFINITY) < HEAT_NETWORK_MAX_DISTANCE;

export const hasSufficientSolarThermalCoverage = (situation: Situation) =>
  (situation.solarThermalCoverage ?? Number.NEGATIVE_INFINITY) > SOLAR_THERMAL_MIN_COVERAGE;

export const hasInsufficientSolarThermalCoverage = (situation: Situation) =>
  situation.solarThermalCoverage != null && situation.solarThermalCoverage < SOLAR_THERMAL_MIN_COVERAGE;

export const hasFavorableGeothermalArea = (situation: Situation) =>
  [1, 2].includes(situation.geothermalNappeGmi ?? 0) || [1, 2].includes(situation.geothermalSondeGmi ?? 0);

export const hasSufficientGeothermalResource = (situation: Situation) => [7, 8, 9].includes(situation.geothermalNappePotential ?? 0);

export const hasUnknownGeothermalResource = (situation: Situation) => [0, 1].includes(situation.geothermalNappePotential ?? 0);

export const hasCompatibleGeothermalPotential = (situation: Situation) =>
  situation.geothermiePossible &&
  hasFavorableGeothermalArea(situation) &&
  (hasUnknownGeothermalResource(situation) || hasSufficientGeothermalResource(situation)) &&
  situation.hasGeothermalProbeSpace !== false;

export const getPdpPrerequisite = (situation: Situation, status: PrerequisiteStatus = 'contraignant'): PrerequisiteRow[] =>
  situation.eligibiliteReseauChaleur?.inPDP
    ? [
        {
          label:
            'Votre bâtiment est situé dans un périmètre de développement prioritaire et soumis à une obligation d’étude du raccordement au réseau de chaleur.',
          source: 'France Chaleur Urbaine',
          status,
        },
      ]
    : [];

type ArchitecturalProtectionKey = keyof Pick<
  Situation,
  | 'architecturalProtectionAc1'
  | 'architecturalProtectionAc2'
  | 'architecturalProtectionAc3'
  | 'architecturalProtectionAc4'
  | 'architecturalProtectionAc4bis'
>;

const architecturalProtectionPrerequisites = [
  ['architecturalProtectionAc1', 'Monuments historiques'],
  ['architecturalProtectionAc2', 'Sites inscrits et classés'],
  ['architecturalProtectionAc3', 'Réserves naturelles'],
  ['architecturalProtectionAc4', 'Sites patrimoniaux remarquables'],
  ['architecturalProtectionAc4bis', "Plans de valorisation de l'architecture et du patrimoine"],
] satisfies readonly [ArchitecturalProtectionKey, string][];

export const getArchitecturalProtectionPrerequisites = (situation: Situation): PrerequisiteRow[] => {
  const labels = architecturalProtectionPrerequisites.filter(([key]) => situation[key]).map(([, label]) => label);

  return labels.length > 0
    ? [
        {
          label: `Votre bâtiment se trouve dans une zone architecturale classée « ${labels.join(', ')} », ce qui peut présenter des contraintes d’intégration`,
          source: 'CEREMA',
          status: 'contraignant',
        },
      ]
    : [];
};

export const getPpaPrerequisite = (situation: Situation): PrerequisiteRow[] =>
  situation.planProtectionAtmosphere
    ? [
        {
          label: 'Votre bâtiment est situé dans une zone de protection de l’atmosphère',
          source: 'CEREMA',
          status: 'contraignant',
        },
      ]
    : [];

export const getGeothermalPrerequisites = (situation: Situation): PrerequisiteRow[] => [
  ...(hasFavorableGeothermalArea(situation)
    ? [
        {
          label: 'Votre bâtiment est situé dans une zone favorable au forage',
          source: 'BRGM',
          status: 'favorable' as const,
        },
      ]
    : []),
  ...(hasSufficientGeothermalResource(situation)
    ? [
        {
          label: 'La ressource énergétique de la parcelle est suffisante',
          source: 'BRGM',
          status: 'favorable' as const,
        },
      ]
    : []),
  ...(hasUnknownGeothermalResource(situation)
    ? [
        {
          label: 'La ressource énergétique de la parcelle est inconnue',
          source: 'BRGM',
          status: 'averifier' as const,
        },
      ]
    : []),
  ...(situation.hasGeothermalProbeSpace
    ? [
        {
          label: 'Place suffisante pour l’implantation de sondes géothermiques',
          source: 'BRGM',
          status: 'favorable' as const,
        },
      ]
    : []),
];

export const outdoorPacPrerequisites = [
  { label: 'Espace requis pour les modules extérieurs', status: 'averifier' },
  {
    label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
    status: 'averifier',
  },
] satisfies PrerequisiteRow[];

export const outdoorSinglePacPrerequisites = [
  { label: 'Espace requis pour le module extérieur', status: 'averifier' },
  {
    label: 'Réglementation acoustique : le bruit ne doit pas dépasser les seuils du Code de la santé publique',
    status: 'averifier',
  },
] satisfies PrerequisiteRow[];

export const collectiveHotWaterPrerequisite = {
  label: "Système d'eau chaude sanitaire collectif",
  source: 'Formulaire',
  status: 'favorable',
} satisfies PrerequisiteRow;

export const hotWaterStoragePrerequisite = {
  label: 'Espace requis en local technique pour les ballons de stockage',
  status: 'averifier',
} satisfies PrerequisiteRow;

export const roofSolarCollectorsPrerequisite = {
  label: 'Espace requis sur la toiture pour les capteurs',
  status: 'averifier',
} satisfies PrerequisiteRow;
