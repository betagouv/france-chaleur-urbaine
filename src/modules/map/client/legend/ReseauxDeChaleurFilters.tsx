import Button from '@codegouvfr/react-dsfr/Button';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { type RangeFilterProps, roundNumberProgressively } from '@/components/form/dsfr/RangeFilter';
import SelectCheckboxes from '@/components/form/dsfr/SelectCheckboxes';
import { getLivraisonsAnnuellesFromPercentage, getPercentageFromLivraisonsAnnuelles } from '@/components/ReseauxDeChaleurFilters';
import { UrlStateAccordion } from '@/components/ui/Accordion';
import {
  type FiltreEnergieConfKey,
  filtresEnergies,
  type MapConfiguration,
  percentageMaxInterval,
} from '@/modules/map/client/config/map-configuration';
import { gestionnairesFilters } from '@/modules/reseaux/constants';
import { intervalsEqual } from '@/utils/interval';

import { useMapConfig } from '../config/useMapConfig';
import { LegendCheckbox } from './LegendCheckbox';
import { LegendIntervalSlider } from './LegendIntervalSlider';

type ReseauxDeChaleurConfig = MapConfiguration['reseauxDeChaleur'];
type ReseauxDeChaleurRangeKey = keyof ReseauxDeChaleurConfig['limits'];

type RangeFilterDef = {
  key: ReseauxDeChaleurRangeKey;
  label: string;
  unit?: string;
  tooltip?: string;
  domainTransform?: RangeFilterProps['domainTransform'];
};

/**
 * Single source of truth for the réseaux de chaleur range filters — used to
 * render the sliders, count active filters and serialize them for `/reseaux`.
 */
const reseauxDeChaleurRangeFilters: readonly RangeFilterDef[] = [
  { key: 'tauxENRR', label: "Taux d'EnR&R", unit: '%' },
  {
    key: 'emissionsCO2',
    label: 'Contenu CO2 ACV',
    tooltip: 'Émissions en analyse du cycle de vie (directes et indirectes)',
    unit: 'gCO2/kWh',
  },
  {
    key: 'contenuCO2',
    label: 'Contenu CO2',
    tooltip: 'Émissions en analyse du cycle de vie (directes et indirectes)',
    unit: 'gCO2/kWh',
  },
  {
    key: 'prixMoyen',
    label: 'Prix moyen de la chaleur',
    tooltip:
      "La comparaison avec le prix d'autres modes de chauffage n'est pertinente qu'en coût global annuel, en intégrant les coûts d'exploitation, de maintenance et d'investissement, amortis sur la durée de vie des installations.",
    unit: '€TTC/MWh',
  },
  {
    domainTransform: {
      percentToValue: (v) => roundNumberProgressively(getLivraisonsAnnuellesFromPercentage(v)),
      valueToPercent: (v) => roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(v)),
    },
    key: 'livraisonsAnnuelles',
    label: 'Livraisons annuelles de chaleur',
    unit: 'GWh',
  },
  { key: 'anneeConstruction', label: 'Année de construction' },
];

/**
 * Réseaux de chaleur filter panel (V1 parity).
 *
 * Binds each filter to its `reseauxDeChaleur.<dim>` path on the active
 * `MapConfiguration`. Bounds come from `reseauxDeChaleur.limits`, fetched once
 * in `useMapConfiguration`. No URL state here — V2 keeps filters in the Jotai
 * store, the same way other legend controls do.
 */
export function ReseauxDeChaleurFilters() {
  const { config, read, updateProperty, setConfig } = useMapConfig();
  const router = useRouter();
  const rdc = config.reseauxDeChaleur;

  const handleResetFilters = () => {
    setConfig({
      ...config,
      reseauxDeChaleur: resetReseauxDeChaleurFilters(rdc),
    });
  };

  const handleViewList = () => {
    const encoded = encodeURIComponent(JSON.stringify(serializeActiveFilters(rdc)));
    router.push(`/reseaux?rdc_filters=${encoded}`);
  };

  const energieOptions = useMemo(
    () =>
      filtresEnergies.map(({ label, confKey }) => ({
        label,
        nativeInputProps: {
          checked: rdc.energieMobilisee.includes(confKey),
          onChange: () => {
            const next = rdc.energieMobilisee.includes(confKey)
              ? rdc.energieMobilisee.filter((key) => key !== confKey)
              : [...rdc.energieMobilisee, confKey];
            updateProperty('reseauxDeChaleur.energieMobilisee', next satisfies FiltreEnergieConfKey[]);
          },
        },
      })),
    [rdc.energieMobilisee, updateProperty]
  );

  const gestionnaireOptions = useMemo(
    () =>
      gestionnairesFilters.map(({ label, value }) => ({
        label,
        nativeInputProps: {
          checked: rdc.gestionnaires.includes(value),
          onChange: () => {
            const next = rdc.gestionnaires.includes(value)
              ? rdc.gestionnaires.filter((key) => key !== value)
              : [...rdc.gestionnaires, value];
            updateProperty('reseauxDeChaleur.gestionnaires', next);
          },
        },
      })),
    [rdc.gestionnaires, updateProperty]
  );

  const nbFilters = countActiveFilters(rdc);
  const disabled = !read<boolean>('reseauxDeChaleur.show');

  return (
    <div aria-disabled={disabled} className="flex flex-col gap-3">
      <div className="text-xs">Filtre uniquement sur les réseaux de chaleur existants, pour lesquels les données sont disponibles.</div>

      <LegendCheckbox path="reseauxDeChaleur.isClassed" label="Réseaux classés" />

      <SelectCheckboxes small label="Énergies mobilisées (au sein d'un même réseau)" options={energieOptions} />

      <UrlStateAccordion id="rdc-filters-energie-ratios" multi={false} label="Plus d'options" simple small>
        <div className="flex flex-col gap-3">
          {filtresEnergies.map(({ confKey, label }) => (
            <LegendIntervalSlider
              key={confKey}
              path={`reseauxDeChaleur.energie_ratio_${confKey}`}
              domain={percentageMaxInterval}
              label={label}
              unit="%"
            />
          ))}
        </div>
      </UrlStateAccordion>

      <SelectCheckboxes small label="Gestionnaires" options={gestionnaireOptions} />

      {reseauxDeChaleurRangeFilters.map((filter) => (
        <LegendIntervalSlider
          key={filter.key}
          path={`reseauxDeChaleur.${filter.key}`}
          domainPath={`reseauxDeChaleur.limits.${filter.key}`}
          label={filter.label}
          unit={filter.unit}
          tooltip={filter.tooltip}
          domainTransform={filter.domainTransform}
        />
      ))}

      {/* Action footer sticks to the bottom of the drawer (V1 parity) — the
          filters list scrolls underneath while the buttons stay reachable. */}
      <div className="sticky -bottom-4 z-1 flex flex-col gap-2 bg-white py-4 [&>button]:w-full [&>button]:justify-center">
        {nbFilters > 0 && (
          <Button type="button" onClick={handleResetFilters} priority="secondary" size="small" iconId="fr-icon-arrow-go-back-line">
            Réinitialiser les filtres
          </Button>
        )}
        <Button
          type="button"
          onClick={handleViewList}
          priority="tertiary"
          size="small"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
        >
          Voir la liste
        </Button>
      </div>
    </div>
  );
}

/** Active-filter count = filters whose value differs from the limits/default. */
export function countActiveFilters(rdc: ReseauxDeChaleurConfig): number {
  const rangeActive = reseauxDeChaleurRangeFilters.filter(({ key }) => !intervalsEqual(rdc[key], rdc.limits[key])).length;
  const energieRatioActive = filtresEnergies.filter(
    ({ confKey }) => !intervalsEqual(rdc[`energie_ratio_${confKey}`], percentageMaxInterval)
  ).length;
  return (
    (rdc.isClassed ? 1 : 0) +
    (rdc.energieMobilisee.length > 0 ? 1 : 0) +
    (rdc.gestionnaires.length > 0 ? 1 : 0) +
    rangeActive +
    energieRatioActive
  );
}

function resetReseauxDeChaleurFilters(rdc: ReseauxDeChaleurConfig): ReseauxDeChaleurConfig {
  return {
    ...rdc,
    energieMobilisee: [],
    gestionnaires: [],
    isClassed: false,
    ...Object.fromEntries(reseauxDeChaleurRangeFilters.map(({ key }) => [key, rdc.limits[key]])),
    ...Object.fromEntries(filtresEnergies.map(({ confKey }) => [`energie_ratio_${confKey}`, percentageMaxInterval])),
  };
}

/**
 * Build the JSON payload consumed by V1's `useReseauxDeChaleurFilters` on the
 * `/reseaux` page : a `Partial<Filters>` shape containing only filters that
 * differ from their default (limits or `percentageMaxInterval`).
 */
export function serializeActiveFilters(rdc: ReseauxDeChaleurConfig): Record<string, unknown> {
  return {
    ...(rdc.isClassed && { isClassed: true }),
    ...(rdc.energieMobilisee.length > 0 && { energieMobilisee: rdc.energieMobilisee }),
    ...(rdc.gestionnaires.length > 0 && { gestionnaires: rdc.gestionnaires }),
    ...Object.fromEntries(
      reseauxDeChaleurRangeFilters.filter(({ key }) => !intervalsEqual(rdc[key], rdc.limits[key])).map(({ key }) => [key, rdc[key]])
    ),
    ...Object.fromEntries(
      filtresEnergies
        .filter(({ confKey }) => !intervalsEqual(rdc[`energie_ratio_${confKey}`], percentageMaxInterval))
        .map(({ confKey }) => [`energie_ratio_${confKey}`, rdc[`energie_ratio_${confKey}`]])
    ),
  };
}
