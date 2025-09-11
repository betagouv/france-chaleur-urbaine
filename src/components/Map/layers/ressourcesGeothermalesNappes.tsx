import { defineLayerPopup, type MapSourceLayersSpecification } from './common';

export const ressourcesGeothermalesNappesOpacity = 0.25;

// ordonné selon la légende
export const ressourcesGeothermalesNappesConfig = [
  { value: 9, label: 'Très fort', color: '#5ad45a' }, // vert foncé
  { value: 8, label: 'Fort', color: '#8be04e' }, // vert
  { value: 7, label: 'Moyen', color: '#c5d96d' }, // vert clair
  { value: 6, label: 'Faible', color: '#1a53ff' }, // bleu
  { value: 5, label: 'Très faible', color: '#0d88e6' }, // bleu clair
  { value: 3, label: 'Aléatoire', color: '#00b7c7' }, // cyan
  { value: 4, label: 'Non connu précisément', color: '#4421af' }, // mauve
  { value: 1, label: "Zones non étudiées, non connu précisément ou d'absence de potentiel", color: '#7c1158' }, // rose pâle
  { value: 2, label: 'Absence de potentiel', color: '#b30000' }, // rouge
] as const;

type RessourceGeothermaleNappe = {
  pot_value: number;
  potentiel: string;
};

const Popup = defineLayerPopup<RessourceGeothermaleNappe>((ressource, { Property, Title, TwoColumns }) => {
  const label = ressourcesGeothermalesNappesConfig.find((item) => item.value === ressource.pot_value)?.label ?? 'Inconnu';

  return (
    <>
      <Title>Ressource géothermale nappe</Title>
      <TwoColumns>
        <Property label="Potentiel" value={label} />
        <Property label="Source" value="BRGM-Ademe" />
      </TwoColumns>
    </>
  );
});

export const ressourcesGeothermalesNappesLayersSpec = [
  {
    sourceId: 'ressourcesGeothermalesNappes',
    source: {
      type: 'vector',
      tiles: ['/api/map/ressourcesGeothermalesNappes/{z}/{x}/{y}'],
      minzoom: 5,
      maxzoom: 12,
    },
    layers: [
      {
        id: 'ressourcesGeothermalesNappes',
        type: 'fill',
        paint: {
          'fill-color': [
            'case',
            ...ressourcesGeothermalesNappesConfig.flatMap(({ value, color }) => [['==', ['get', 'pot_value'], value], color]),
            '#cccccc', // couleur par défaut si pot_value n'est pas reconnu
          ] as any, // Expression MapLibre complexe
          'fill-opacity': ressourcesGeothermalesNappesOpacity,
        },
        isVisible: (config) => config.ressourcesGeothermalesNappes,
        popup: Popup,
      },
    ],
  },
] as const satisfies ReadonlyArray<MapSourceLayersSpecification>;
