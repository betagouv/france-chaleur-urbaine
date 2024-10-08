import { Select } from '@codegouvfr/react-dsfr/SelectNext';

import Accordion from '@components/ui/Accordion';
import Divider from '@components/ui/Divider';
import { FiltreEnergieConfKey, filtresEnergies, percentageMaxInterval } from 'src/services/Map/map-configuration';

import RangeFilter from './RangeFilter';
import { DeactivatableBox } from './SimpleMapLegend.style';
import useFCUMap from '../MapProvider';

function ReseauxDeChaleurFilters() {
  const { mapConfiguration, setMapConfiguration, updateScaleInterval } = useFCUMap();
  return (
    <DeactivatableBox disabled={!mapConfiguration.reseauxDeChaleur.show}>
      <Select
        label="Énergie majoritaire"
        nativeSelectProps={{
          value: mapConfiguration.reseauxDeChaleur.energieMajoritaire,
          onChange: (e) => {
            mapConfiguration.reseauxDeChaleur.energieMajoritaire =
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
              onChange={updateScaleInterval(`reseauxDeChaleur.energie_ratio_${filtreEnergie.confKey}`)}
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
        onChange={updateScaleInterval('reseauxDeChaleur.tauxENRR')}
        unit="%"
      />
      <Divider />
      <RangeFilter
        label="Émissions de CO2"
        domain={mapConfiguration.reseauxDeChaleur.limits.emissionsCO2}
        value={mapConfiguration.reseauxDeChaleur.emissionsCO2}
        onChange={updateScaleInterval('reseauxDeChaleur.emissionsCO2')}
        unit="gCO2/kWh"
        tooltip="Émissions en analyse du cycle de vie (directes et indirectes)"
      />
      <Divider />
      <RangeFilter
        label="Prix moyen de la chaleur"
        domain={mapConfiguration.reseauxDeChaleur.limits.prixMoyen}
        value={mapConfiguration.reseauxDeChaleur.prixMoyen}
        onChange={updateScaleInterval('reseauxDeChaleur.prixMoyen')}
        unit="€TTC/MWh"
        tooltip="La comparaison avec le prix d'autres modes de chauffage n’est pertinente qu’en coût global annuel, en intégrant les coûts d’exploitation, de maintenance et d’investissement, amortis sur la durée de vie des installations."
      />
      <Divider />
      <RangeFilter
        label="Livraisons annuelles de chaleur"
        domain={mapConfiguration.reseauxDeChaleur.limits.livraisonsAnnuelles}
        value={mapConfiguration.reseauxDeChaleur.livraisonsAnnuelles}
        onChange={updateScaleInterval('reseauxDeChaleur.livraisonsAnnuelles')}
        domainTransform={{
          percentToValue: (v) => roundNumberProgressively(getLivraisonsAnnuellesFromPercentage(v)),
          valueToPercent: (v) => roundNumberProgressively(getPercentageFromLivraisonsAnnuelles(v)),
        }}
        unit="GWh"
      />
      <Divider />
      <RangeFilter
        label="Année de construction"
        domain={mapConfiguration.reseauxDeChaleur.limits.anneeConstruction}
        value={mapConfiguration.reseauxDeChaleur.anneeConstruction}
        onChange={updateScaleInterval('reseauxDeChaleur.anneeConstruction')}
      />
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
