import { Button } from '@codegouvfr/react-dsfr/Button';
import { Select } from '@codegouvfr/react-dsfr/SelectNext';
import React from 'react';

import RangeFilter from '@components/Map/components/RangeFilter';
import useFCUMap from '@components/Map/MapProvider';
import Accordion from '@components/ui/Accordion';
import Divider from '@components/ui/Divider';
import { FiltreEnergieConfKey, filtresEnergies, percentageMaxInterval } from 'src/services/Map/map-configuration';

import { DeactivatableBox } from './SimpleMapLegend.style';

function ReseauxDeChaleurFilters() {
  const { mapConfiguration, setMapConfiguration, updateScaleInterval } = useFCUMap();

  const [isFiltering, toggleFiltering] = React.useState(false);

  const filterAndUpdateScaleInterval: typeof updateScaleInterval = (property) => {
    toggleFiltering(true);
    return updateScaleInterval(property);
  };

  const resetFilters = () => {
    setMapConfiguration({
      ...mapConfiguration,
      reseauxDeChaleur: {
        ...mapConfiguration.reseauxDeChaleur,
        ...mapConfiguration.reseauxDeChaleur.limits,
      },
    });
    toggleFiltering(false);
  };

  return (
    <DeactivatableBox disabled={!mapConfiguration.reseauxDeChaleur.show}>
      <Select
        label="Énergie mobilisée"
        nativeSelectProps={{
          value: mapConfiguration.reseauxDeChaleur.energieMobilisee,
          onChange: (e) => {
            toggleFiltering(true);
            mapConfiguration.reseauxDeChaleur.energieMobilisee =
              e.target.value === '' ? undefined : (e.target.value as FiltreEnergieConfKey);
            setMapConfiguration({ ...mapConfiguration });
          },
        }}
        className="fr-mb-1v"
        options={[
          {
            label: "Type d'énergie",
            value: '',
          },
          ...filtresEnergies.map(({ label, confKey }) => ({
            label,
            value: confKey,
          })),
        ]}
      />
      <Accordion label="Plus d'options" style={{ margin: '0.25rem 0' }} simple small>
        <DeactivatableBox disabled={!mapConfiguration.reseauxDeChaleur.show}>
          {filtresEnergies.map((filtreEnergie) => (
            <RangeFilter
              key={filtreEnergie.confKey}
              label={filtreEnergie.label}
              domain={percentageMaxInterval}
              value={mapConfiguration.reseauxDeChaleur[`energie_ratio_${filtreEnergie.confKey}`]}
              onChange={(interval) => filterAndUpdateScaleInterval(`reseauxDeChaleur.energie_ratio_${filtreEnergie.confKey}`)(interval)}
              unit="%"
            />
          ))}
        </DeactivatableBox>
      </Accordion>
      <Divider />

      <RangeFilter
        label="Taux d’EnR&R"
        domain={percentageMaxInterval}
        value={mapConfiguration.reseauxDeChaleur.tauxENRR}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.tauxENRR')(interval)}
        unit="%"
      />
      <Divider />
      <RangeFilter
        label="Émissions de CO2"
        domain={mapConfiguration.reseauxDeChaleur.limits.emissionsCO2}
        value={mapConfiguration.reseauxDeChaleur.emissionsCO2}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.emissionsCO2')(interval)}
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <Divider />
      <RangeFilter
        label="Prix moyen de la chaleur"
        domain={mapConfiguration.reseauxDeChaleur.limits.prixMoyen}
        value={mapConfiguration.reseauxDeChaleur.prixMoyen}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.prixMoyen')(interval)}
        unit="€TTC/MWh"
        tooltip="La comparaison avec le prix d'autres modes de chauffage n’est pertinente qu’en coût global annuel, en intégrant les coûts d’exploitation, de maintenance et d’investissement, amortis sur la durée de vie des installations."
      />
      <Divider />
      <RangeFilter
        label="Livraisons annuelles de chaleur"
        domain={mapConfiguration.reseauxDeChaleur.limits.livraisonsAnnuelles}
        value={mapConfiguration.reseauxDeChaleur.livraisonsAnnuelles}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.livraisonsAnnuelles')(interval)}
        domainTransform={{
          percentToValue: (v) => roundNumberProgressively(getLivraisonsAnnuellesFromPercentage(v)),
          valueToPercent: (v) => roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(v)),
        }}
        unit="GWh"
        nonLinear
      />
      <Divider />
      <RangeFilter
        label="Année de construction"
        domain={mapConfiguration.reseauxDeChaleur.limits.anneeConstruction}
        value={mapConfiguration.reseauxDeChaleur.anneeConstruction}
        onChange={(interval) => filterAndUpdateScaleInterval('reseauxDeChaleur.anneeConstruction')(interval)}
      />
      {isFiltering && (
        <Button type="button" onClick={resetFilters} priority="secondary" size="small" iconId="fr-icon-back-line" className="fr-mb-2w">
          Réinitialiser les filtres
        </Button>
      )}
    </DeactivatableBox>
  );
}

export default ReseauxDeChaleurFilters;

export function getLivraisonsAnnuellesFromPercentage(v: number): number {
  if (v < 25) {
    return 0.06 * v;
  }
  if (v < 50) {
    return 0.54 * v - 12;
  }
  if (v < 75) {
    return 3.4 * v - 155;
  }
  return 149.48 * v - 11111;
}

export function getPercentageFromLivraisonsAnnuelles(v: number): number {
  if (v < 1.5) {
    return v / 0.06;
  }
  if (v < 15) {
    return (v + 12) / 0.54;
  }
  if (v < 100) {
    return (v + 155) / 3.4;
  }
  return (v + 11111) / 149.48;
}

export function roundNumberProgressively(v: number): number {
  return v > 2 ? Math.round(v) : v > 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}
