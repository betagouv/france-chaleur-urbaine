import { defineLayerPopup, type MapSourceLayersSpecification } from './common';

export const ressourcesGeothermalesNappesOpacity = 0.25;

// ordonné selon la légende
export const ressourcesGeothermalesNappesConfig = [
  { color: '#5ad45a', label: 'Très fort', value: 9 }, // vert foncé
  { color: '#8be04e', label: 'Fort', value: 8 }, // vert
  { color: '#c5d96d', label: 'Moyen', value: 7 }, // vert clair
  { color: '#1a53ff', label: 'Faible', value: 6 }, // bleu
  { color: '#0d88e6', label: 'Très faible', value: 5 }, // bleu clair
  { color: '#00b7c7', label: 'Aléatoire', value: 3 }, // cyan
  { color: '#4421af', label: 'Non connu précisément', value: 4 }, // mauve
  { color: '#7c1158', label: "Zones non étudiées, non connu précisément ou d'absence de potentiel", value: 1 }, // rose pâle
  { color: '#b30000', label: 'Absence de potentiel', value: 2 }, // rouge
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
    layers: [
      {
        id: 'ressourcesGeothermalesNappes',
        isVisible: (config) => config.ressourcesGeothermalesNappes,
        paint: {
          'fill-color': [
            'case',
            ...ressourcesGeothermalesNappesConfig.flatMap(({ value, color }) => [['==', ['get', 'pot_value'], value], color]),
            '#cccccc', // couleur par défaut si pot_value n'est pas reconnu
          ] as any, // Expression MapLibre complexe
          'fill-opacity': ressourcesGeothermalesNappesOpacity,
        },
        popup: Popup,
        type: 'fill',
      },
    ],
    source: {
      maxzoom: 12,
      minzoom: 5,
      tiles: ['/api/map/ressourcesGeothermalesNappes/{z}/{x}/{y}'],
      type: 'vector',
    },
    sourceId: 'ressourcesGeothermalesNappes',
  },
] as const satisfies readonly MapSourceLayersSpecification[];
