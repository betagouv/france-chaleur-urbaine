import Button from '@codegouvfr/react-dsfr/Button';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import { roundNumberProgressively } from '@/components/form/dsfr/RangeFilter';
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

type RDC = MapConfiguration['reseauxDeChaleur'];

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

      <LegendIntervalSlider path="reseauxDeChaleur.tauxENRR" domainPath="reseauxDeChaleur.limits.tauxENRR" label="Taux d'EnR&R" unit="%" />
      <LegendIntervalSlider
        path="reseauxDeChaleur.emissionsCO2"
        domainPath="reseauxDeChaleur.limits.emissionsCO2"
        label="Contenu CO2 ACV"
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <LegendIntervalSlider
        path="reseauxDeChaleur.contenuCO2"
        domainPath="reseauxDeChaleur.limits.contenuCO2"
        label="Contenu CO2"
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <LegendIntervalSlider
        path="reseauxDeChaleur.prixMoyen"
        domainPath="reseauxDeChaleur.limits.prixMoyen"
        label="Prix moyen de la chaleur"
        unit="€TTC/MWh"
        tooltip="La comparaison avec le prix d'autres modes de chauffage n'est pertinente qu'en coût global annuel, en intégrant les coûts d'exploitation, de maintenance et d'investissement, amortis sur la durée de vie des installations."
      />
      <LegendIntervalSlider
        path="reseauxDeChaleur.livraisonsAnnuelles"
        domainPath="reseauxDeChaleur.limits.livraisonsAnnuelles"
        label="Livraisons annuelles de chaleur"
        unit="GWh"
        domainTransform={{
          percentToValue: (v) => roundNumberProgressively(getLivraisonsAnnuellesFromPercentage(v)),
          valueToPercent: (v) => roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(v)),
        }}
      />
      <LegendIntervalSlider
        path="reseauxDeChaleur.anneeConstruction"
        domainPath="reseauxDeChaleur.limits.anneeConstruction"
        label="Année de construction"
      />

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
export function countActiveFilters(rdc: RDC): number {
  let n = 0;
  if (rdc.isClassed) n++;
  if (rdc.energieMobilisee.length > 0) n++;
  if (rdc.gestionnaires.length > 0) n++;

  const rangeKeys: (keyof RDC['limits'])[] = [
    'tauxENRR',
    'emissionsCO2',
    'contenuCO2',
    'prixMoyen',
    'livraisonsAnnuelles',
    'anneeConstruction',
  ];
  for (const key of rangeKeys) {
    if (!intervalsEqual(rdc[key], rdc.limits[key])) n++;
  }
  for (const { confKey } of filtresEnergies) {
    if (!intervalsEqual(rdc[`energie_ratio_${confKey}`], percentageMaxInterval)) n++;
  }
  return n;
}

function resetReseauxDeChaleurFilters(rdc: RDC): RDC {
  const next: RDC = {
    ...rdc,
    anneeConstruction: rdc.limits.anneeConstruction,
    contenuCO2: rdc.limits.contenuCO2,
    emissionsCO2: rdc.limits.emissionsCO2,
    energie_ratio_biomasse: percentageMaxInterval,
    energie_ratio_chaleurIndustrielle: percentageMaxInterval,
    energie_ratio_fioul: percentageMaxInterval,
    energie_ratio_gaz: percentageMaxInterval,
    energie_ratio_geothermie: percentageMaxInterval,
    energie_ratio_pompeAChaleur: percentageMaxInterval,
    energie_ratio_solaireThermique: percentageMaxInterval,
    energie_ratio_uve: percentageMaxInterval,
    energieMobilisee: [],
    gestionnaires: [],
    isClassed: false,
    livraisonsAnnuelles: rdc.limits.livraisonsAnnuelles,
    prixMoyen: rdc.limits.prixMoyen,
    tauxENRR: rdc.limits.tauxENRR,
  };
  return next;
}

/**
 * Build the JSON payload consumed by V1's `useReseauxDeChaleurFilters` on the
 * `/reseaux` page : a `Partial<Filters>` shape containing only filters that
 * differ from their default (limits or `percentageMaxInterval`).
 */
function serializeActiveFilters(rdc: RDC): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (rdc.isClassed) out.isClassed = true;
  if (rdc.energieMobilisee.length > 0) out.energieMobilisee = rdc.energieMobilisee;
  if (rdc.gestionnaires.length > 0) out.gestionnaires = rdc.gestionnaires;

  const rangeKeys: (keyof RDC['limits'])[] = [
    'tauxENRR',
    'emissionsCO2',
    'contenuCO2',
    'prixMoyen',
    'livraisonsAnnuelles',
    'anneeConstruction',
  ];
  for (const key of rangeKeys) {
    if (!intervalsEqual(rdc[key], rdc.limits[key])) out[key] = rdc[key];
  }
  for (const { confKey } of filtresEnergies) {
    const key = `energie_ratio_${confKey}` as const;
    if (!intervalsEqual(rdc[key], percentageMaxInterval)) out[key] = rdc[key];
  }
  return out;
}
